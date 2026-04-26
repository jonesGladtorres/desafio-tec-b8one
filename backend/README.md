# Backend

API NestJS do Portal de Agendamento de Exames.

Para rodar o projeto completo (frontend, backend, PostgreSQL e Redis), use o Docker Compose documentado no [README da raiz](../README.md).

## Stack

- NestJS 11 (modular)
- Prisma 7 + PostgreSQL 16
- Redis 7 (cache + storage do throttler)
- JWT com refresh token rotacionado (`@nestjs/jwt`)
- Pino (logs estruturados via `nestjs-pino`)
- Terminus (health check Postgres + Redis)
- Swagger (`@nestjs/swagger`)

## Variáveis de ambiente

Exemplo para execução local — todos vêm de `.env` (ver `.env.example`):

```bash
NODE_ENV=development
PORT=8000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exams_portal?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-me-in-production-change-me-in-production"
JWT_REFRESH_SECRET="change-me-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3001"
API_VERSION_HEADER="X-API-Version"
```

`JWT_SECRET` e `JWT_REFRESH_SECRET` são obrigatórios. Em produção, gere com:

```bash
openssl rand -hex 64
```

## Rodar apenas o backend localmente

Suba PostgreSQL e Redis pela raiz do repositório:

```bash
docker compose up postgres redis -d
```

Instale dependências e prepare o banco:

```bash
cd backend
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

Inicie a API:

```bash
npm run start:dev
```

URLs:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

Credenciais criadas pelo seed:

```text
E-mail: patient@example.com
Senha: Password123!
```

## Versionamento

Todas as rotas versionadas esperam o header:

```text
X-API-Version: 1
```

Exemplo:

```bash
curl http://localhost:8000/exams -H "X-API-Version: 1"
```

## Scripts

```bash
npm run start:dev       # desenvolvimento
npm run build           # build de produção
npm run start:prod      # executa dist
npm test                # testes unitários
npm run test:cov        # unit + cobertura
npm run test:e2e        # e2e (precisa de Postgres + Redis rodando)
npm run db:migrate      # cria/aplica migrations em dev
npm run db:deploy       # aplica migrations em ambiente de deploy
npm run db:seed         # popula dados iniciais
npm run db:reset        # zera o banco (preserve dados em dev!)
```

## Módulos principais

- `auth`: cadastro, login, refresh rotacionado, logout, JWT.
- `users`: perfil autenticado do paciente.
- `exams`: catálogo, detalhes e horários disponíveis (com cache Redis).
- `appointments`: agendamento (transação Serializable + business hours), listagem e cancelamento idempotente.
- `cache`: integração Redis (cliente compartilhado + helpers de cache JSON).
- `health`: Terminus health check para Postgres e Redis.
- `database`: Prisma Client.
- `config`: validação de env via class-validator.

## Segurança

- Helmet em todas as rotas.
- CORS restrito a `CORS_ORIGIN`.
- Throttler com storage Redis: 60 req/min global, 5/min em `/auth/login` e `/auth/register`.
- Refresh tokens armazenados como hash SHA-256 (zero-knowledge).
- Detecção de reuso de refresh: revoga todos os tokens do usuário se um token revogado for reapresentado.
- Pino com `redact` para `Authorization`, `password`, `refreshToken` e correlatos.
