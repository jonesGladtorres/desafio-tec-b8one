# Portal de Agendamento de Exames

Projeto fullstack para uma rede de laboratórios — catálogo de exames, agendamento e cancelamento, perfil do paciente e experiência integrada entre frontend e backend.

## Stack

- **Backend**: NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, JWT (access + refresh rotation), Pino, Swagger.
- **Frontend**: Next.js 16 (App Router), React 19, React Query, TypeScript estrito, Zod, Tailwind 4.
- **Infra**: Docker Compose com healthchecks, GitHub Actions CI, Husky + lint-staged + Conventional Commits.

## Como rodar tudo com Docker

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build -d
```

Serviços disponíveis:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health (Postgres + Redis): http://localhost:8000/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

O backend aplica migrations e executa o seed automaticamente ao subir pelo Docker.

Credenciais de teste:

```text
E-mail: patient@example.com
Senha: Password123!
```

Para acompanhar logs:

```bash
docker compose logs -f
```

Para parar os containers:

```bash
docker compose down
```

Para parar e apagar os volumes do banco/Redis:

```bash
docker compose down -v
```

## Variáveis de ambiente

Todos os segredos vêm de `.env` na raiz (consulte `.env.example`). O Compose usa `${VAR:?}` para segredos obrigatórios — subir o stack sem `JWT_SECRET` ou `JWT_REFRESH_SECRET` falha rápido com mensagem explícita.

Para gerar segredos fortes em produção:

```bash
openssl rand -hex 64
```

## Makefile

Atalhos para fluxos comuns:

```bash
make help
make up       # docker compose up --build -d
make logs
make ps
make health   # checa /health, postgres, redis
make down
make dev      # postgres + redis em Docker, frontend e backend locais
make test     # roda testes do front e back
```

## Versionamento da API

A API usa versionamento por header:

```text
X-API-Version: 1
```

O frontend envia esse header em todas as chamadas. Para testar via `curl`:

```bash
curl http://localhost:8000/exams -H "X-API-Version: 1"
```

## Arquitetura geral

```text
frontend/
  Next.js App Router, React Query, Zod, telas do portal, autenticação client-side
backend/
  NestJS modular, autenticação JWT + refresh, exames, agendamentos, Prisma, Pino
docker-compose.yml
  Orquestra frontend, backend, postgres, redis com healthchecks
.github/workflows/ci.yml
  Lint, typecheck, testes unitários, e2e e cobertura no PR
```

Fluxo integrado:

1. O paciente autentica no frontend (`/login` ou `/register`).
2. O frontend chama o backend em `http://localhost:8000`.
3. Rotas server-side do Next usam `API_INTERNAL_URL=http://backend:8000` dentro do Docker.
4. O backend persiste no PostgreSQL, usa Redis para cache de listagens e armazena hashes dos refresh tokens.

## Endpoints principais

| Método | Caminho | Auth | Observação |
|---|---|---|---|
| POST | `/auth/register` | público | cria conta + emite tokens |
| POST | `/auth/login` | público | emite access + refresh |
| POST | `/auth/refresh` | público | rotaciona refresh, detecta reuso |
| POST | `/auth/logout` | bearer | revoga refresh |
| GET | `/exams` | público | busca + paginação, cache Redis (TTL 5 min) |
| GET | `/exams/:id` | público | detalhes |
| GET | `/exams/:id/available-slots` | público | horários comerciais 8h–17h30 UTC |
| GET | `/users/me` | bearer | perfil + estatísticas |
| PATCH | `/users/me` | bearer | edita perfil/senha |
| POST | `/appointments` | bearer | cria agendamento (transação Serializable) |
| GET | `/appointments` | bearer | lista do usuário paginada |
| PATCH | `/appointments/:id/cancel` | bearer | cancela (idempotência via 409) |
| GET | `/health` | público | Terminus: Postgres + Redis |

Documentação interativa completa: http://localhost:8000/docs.

## Rodar separadamente

- Backend: veja [backend/README.md](backend/README.md)
- Frontend: veja [frontend/README.md](frontend/README.md)

Para desenvolvimento com banco e Redis em Docker:

```bash
docker compose up postgres redis -d
```

Depois inicie backend e frontend conforme os READMEs de cada pasta — ou simplesmente:

```bash
make dev
```

## Qualidade

- ESLint + TypeScript em ambos os projetos.
- Jest no backend (unit + e2e contra Postgres real) com `coverageThreshold` mínimo de 60%.
- Vitest no frontend com cobertura.
- Pipeline CI rodando lint, typecheck, unit tests e e2e em PRs.
- Husky + `lint-staged` rodando lint apenas nos arquivos alterados antes do commit.
- `commitlint` com `@commitlint/config-conventional` validando mensagens (`feat:`, `fix:`, `refactor:` etc.).

```bash
cd backend && npm test                # unit
cd backend && npm run test:e2e        # exige Postgres + Redis
cd backend && npm run test:cov        # cobertura
cd frontend && npm run test:run       # unit
cd frontend && npm run test:coverage  # cobertura
cd frontend && npm run lint           # lint
cd frontend && npm run build          # build
```

## Decisões técnicas (ADRs resumidos)

### 1. Prisma em vez de TypeORM
Prisma oferece migrations declarativas, tipos gerados a partir do schema e melhor DX. Para um sistema com regras de negócio relativamente simples e foco em segurança de tipo, o trade-off pendeu para Prisma.

### 2. Transação Serializable + índices únicos para agendamento
Conflito de horário é prevenido em duas camadas:
- **`AppointmentsService.create`** roda em `Prisma.TransactionIsolationLevel.Serializable` e checa o slot dentro da transação.
- **Schema** tem `@@unique([examId, scheduledAt])` e `@@unique([userId, scheduledAt])` — mesmo se duas transações racing escaparem da checagem, uma delas falha em `P2002` e o serviço mapeia para `409 Conflict`.

Resultado: zero double-booking mesmo sob carga concorrente. Coberto por teste e2e (`appointments.e2e-spec.ts`).

### 3. Cache de listagem com invalidação preguiçosa
A listagem `/exams` cacheia em Redis por 5 minutos. Não há invalidação ativa porque não há CRUD de exames neste escopo — quando houver, basta chamar `redis.deleteByPattern('v1:exams:list:*')` no service de exames. O método já existe em `RedisService.deleteByPattern`.

### 4. JWT access curto + refresh token rotacionado
- Access token: 15 minutos, assinado com `JWT_SECRET`.
- Refresh token: 7 dias, assinado com `JWT_REFRESH_SECRET` separado, persistido como **hash SHA-256** na tabela `refresh_tokens`.
- A cada `/auth/refresh` o token atual é revogado e um novo é emitido (rotação).
- Detecção de reuso: se um refresh já revogado chega, **todos** os refresh tokens do usuário são revogados (defesa contra roubo de token).

### 5. Token no `localStorage` no frontend
Optei por `localStorage` por simplicidade do desafio — JWT acessível ao JS facilita injetar em headers em qualquer rota client-side. Em produção, migraria para **cookie httpOnly + Secure + SameSite=Lax** com CSRF token, eliminando exposição XSS. O middleware (`src/proxy.ts`) já lê o cookie auxiliar para SSR redirects.

### 6. Throttler com storage Redis
O `@nestjs/throttler` em modo padrão usa storage em memória, o que não escala horizontalmente. Substituí por `@nest-lab/throttler-storage-redis`, conectando ao mesmo Redis usado pelo cache. Limites: 60 req/min global, 5/min em `/auth/login` e `/auth/register`, 30/min em `/auth/refresh`.

### 7. Logger estruturado (Pino)
Substituí o `Logger` default por `nestjs-pino`, com:
- `pino-pretty` em dev, JSON em prod.
- Correlation ID por request automático.
- `redact` aplicado a `Authorization`, `Cookie`, `password`, `currentPassword`, `newPassword`, `refreshToken` — tokens nunca caem em log.
- `/health` ignorado para reduzir ruído.

### 8. Health check com Terminus
`GET /health` consulta Postgres (`PrismaHealthIndicator.pingCheck`) e Redis (`PING` custom). O Compose usa esse endpoint como `healthcheck` do container backend.

### 9. Validação de horário comercial no service
A regra de slots de 30 min entre 08:00 e 17:30 (UTC) está duplicada no front (UI) e no back (`AppointmentsService.assertBusinessHours`). Isso impede que um cliente malicioso pule a UI e marque às 03h00. A regra está cobertas por dois testes unitários.

### 10. Docker multi-stage
Tanto frontend quanto backend usam multi-stage:
- **builder**: instala devDependencies, gera Prisma client, compila TypeScript.
- **runner**: copia apenas o `dist`, `node_modules` produtivos e usa `tini` como init.

Reduz ~70% da imagem final e melhora startup.

## Observabilidade futura (não implementado)
- **Sentry** para captura de exceções: bastaria `SentryModule.forRoot()` e o interceptor.
- **OpenTelemetry**: o `nestjs-pino` já está pronto para receber `traceId` se um tracer global injetar; bastaria adicionar `@opentelemetry/api`.
- **Grafana dashboards**: métricas Prometheus via `@willsoto/nestjs-prometheus`.

## Observabilidade atual
- Logs estruturados Pino.
- `/health` para liveness/readiness.
- Coverage reports anexados ao job de CI.
