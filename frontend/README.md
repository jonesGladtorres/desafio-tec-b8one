# Frontend

Aplicacao Next.js do Portal do Paciente para busca, visualizacao e agendamento de exames.

Para rodar o projeto completo com frontend, backend, PostgreSQL e Redis, use o Docker Compose documentado no [README da raiz](../README.md).

## Stack

- Next.js App Router
- React
- TypeScript
- React Query
- Lucide React
- CSS utilitario com Tailwind

## Variaveis de ambiente

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

Essa separacao permite que o browser acesse a API pela porta publica `8000`, enquanto rotas server-side do Next chamam o backend pelo nome do servico Docker.

## Rodar apenas o frontend localmente

Antes, garanta que o backend esteja rodando em `http://localhost:8000`.

Instale dependencias:

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

Observacao: quando o projeto roda pelo Docker Compose da raiz, o frontend fica publicado em `http://localhost:3000`.

## Scripts

```bash
npm run dev            # desenvolvimento na porta 3001
npm run build          # build de producao
npm run start          # servidor de producao na porta 3001
npm run lint           # lint
npm run test:run       # testes
npm run test:coverage  # cobertura
```

## Fluxos implementados

- Login e cadastro.
- Catalogo de exames com busca.
- Tela de detalhes do exame.
- Tela dedicada para agendamento.
- Confirmacao de agendamento por modal.
- Agenda do paciente com cancelamento por modal.
- Perfil do paciente com edicao de dados.
- Toasts para sucesso, erro e informacoes do fluxo.

## Credenciais de teste

Com o seed do backend executado:

```text
E-mail: patient@example.com
Senha: Password123!
```
