# Portal de Agendamento de Exames

Projeto fullstack para uma rede de laboratorios, com catalogo de exames, agendamento, cancelamento, perfil do paciente e experiencia integrada entre frontend e backend.

## Stack

- Backend: NestJS, Prisma, PostgreSQL, Redis, JWT, Swagger, Docker.
- Frontend: Next.js App Router, React Query, TypeScript, CSS responsivo e componentes client-side.
- Infra local: Docker Compose com frontend, backend, PostgreSQL e Redis.

## Como rodar tudo com Docker

Na raiz do repositorio:

```bash
docker compose up --build -d
```

Servicos disponiveis:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
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

## Makefile

O projeto tambem possui atalhos:

```bash
make help
make up
make logs
make ps
make health
make down
```

## Versionamento da API

A API usa versionamento por header, conforme definido no projeto:

```text
X-API-Version: 1
```

O frontend ja envia esse header automaticamente em todas as chamadas. Para testar direto via `curl`, inclua o header:

```bash
curl http://localhost:8000/health -H "X-API-Version: 1"
```

## Arquitetura geral

```text
frontend/
  Next.js, telas do portal, autenticacao client-side e chamadas HTTP

backend/
  NestJS modular, autenticacao JWT, exames, agendamentos, usuarios e Prisma

docker-compose.yml
  Orquestra frontend, backend, postgres e redis
```

Fluxo integrado:

1. O paciente autentica no frontend.
2. O frontend chama o backend em `http://localhost:8000`.
3. Rotas server-side do Next usam `API_INTERNAL_URL=http://backend:8000` dentro do Docker.
4. O backend persiste dados no PostgreSQL e usa Redis para cache de consultas.

## Rodar separadamente

Cada aplicacao tambem pode ser executada isoladamente:

- Backend: veja [backend/README.md](backend/README.md)
- Frontend: veja [frontend/README.md](frontend/README.md)

Para desenvolvimento local com banco e Redis em Docker:

```bash
docker compose up postgres redis -d
```

Depois inicie backend e frontend em terminais separados conforme os READMEs de cada pasta.

## Qualidade

Comandos principais:

```bash
cd backend && npm test
cd frontend && npm run test:run
cd frontend && npm run lint
cd frontend && npm run build
```
