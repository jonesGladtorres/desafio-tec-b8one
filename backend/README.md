# Backend

API NestJS do Portal de Agendamento de Exames.

Para rodar o projeto completo com frontend, backend, PostgreSQL e Redis, use o Docker Compose documentado no [README da raiz](../README.md).

## Stack

- NestJS
- Prisma
- PostgreSQL
- Redis
- JWT
- Swagger
- Docker

## Variaveis de ambiente

Exemplo para execucao local:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exams_portal?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-me-in-production-change-me-in-production"
JWT_EXPIRES_IN="15m"
CORS_ORIGIN="http://localhost:3001"
API_VERSION_HEADER="X-API-Version"
PORT="8000"
```

## Rodar apenas o backend localmente

Suba PostgreSQL e Redis pela raiz do repositorio:

```bash
docker compose up postgres redis -d
```

Instale dependencias e prepare o banco:

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
npm run build           # build de producao
npm run start:prod      # executa dist
npm test                # testes unitarios
npm run test:e2e        # testes e2e
npm run db:migrate      # cria/aplica migrations em dev
npm run db:deploy       # aplica migrations em ambiente de deploy
npm run db:seed         # popula dados iniciais
```

## Modulos principais

- `auth`: cadastro, login e emissao de JWT.
- `users`: perfil autenticado do paciente.
- `exams`: catalogo, detalhes e horarios disponiveis.
- `appointments`: agendamento, listagem e cancelamento.
- `cache`: integracao Redis.
- `database`: Prisma Client.
