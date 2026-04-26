# Frontend

Aplicação Next.js do Portal do Paciente — busca, visualização e agendamento de exames.

Para rodar o projeto completo (frontend, backend, PostgreSQL e Redis), use o Docker Compose documentado no [README da raiz](../README.md).

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript estrito (sem `any`)
- React Query (`@tanstack/react-query`)
- Zod para validação de formulários
- Tailwind CSS 4
- Vitest + Testing Library

## Variáveis de ambiente

Crie um `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

Para rodar o frontend localmente contra o backend local:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
API_INTERNAL_URL=http://localhost:8000
```

No Docker Compose da raiz, o frontend usa:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
API_INTERNAL_URL=http://backend:8000
```

Essa separação permite que o browser acesse a API pela porta pública `8000`, enquanto rotas server-side do Next chamam o backend pelo nome do serviço Docker.

## Rodar apenas o frontend localmente

Antes, garanta que o backend esteja rodando em `http://localhost:8000`.

Instale dependências:

```bash
cd frontend
npm install
```

Inicie em desenvolvimento:

```bash
npm run dev
```

URL local:

```text
http://localhost:3001
```

Observação: quando o projeto roda pelo Docker Compose da raiz, o frontend fica publicado em `http://localhost:3000`.

## Scripts

```bash
npm run dev            # desenvolvimento na porta 3001
npm run build          # build de produção
npm run start          # servidor de produção na porta 3001
npm run lint           # lint
npm run test:run       # testes
npm run test:coverage  # cobertura
```

## Fluxos implementados

- Login e cadastro com validação Zod.
- Catálogo de exames com busca e cache (React Query + Redis no backend).
- Tela de detalhes do exame com SEO dinâmico (Open Graph, Twitter, JSON-LD `MedicalTest`).
- Tela dedicada de agendamento com seleção de data, períodos do dia e observações.
- Confirmação de agendamento por modal com lock de scroll.
- Agenda do paciente com cancelamento idempotente.
- Perfil do paciente com edição de dados e troca de senha.
- Toasts acessíveis (`aria-live`) para sucesso, erro e informações.
- Refresh token transparente — interceptador renova access token antes de cair no `/login`.
- Logout server-side (revoga refresh) + limpeza local.

## Credenciais de teste

Com o seed do backend executado:

```text
E-mail: patient@example.com
Senha: Password123!
```
