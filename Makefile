.DEFAULT_GOAL := help
.PHONY: help up down build restart logs logs-backend logs-frontend logs-db \
        ps clean clean-all install install-frontend install-backend \
        dev dev-frontend dev-backend \
        test test-frontend test-backend test-coverage \
        lint lint-frontend lint-backend \
        db-migrate db-seed db-studio \
        health open

# ─── Cores ────────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
CYAN  := \033[36m
GREEN := \033[32m
YELLOW:= \033[33m

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Mostra esta ajuda
	@printf "\n$(BOLD)Portal de Agendamento de Exames$(RESET)\n\n"
	@printf "$(CYAN)Docker$(RESET)\n"
	@grep -E '^(up|down|build|restart|logs|ps|clean).*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(CYAN)Desenvolvimento local$(RESET)\n"
	@grep -E '^(install|dev).*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(CYAN)Testes$(RESET)\n"
	@grep -E '^test.*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(CYAN)Qualidade de código$(RESET)\n"
	@grep -E '^lint.*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(CYAN)Banco de dados$(RESET)\n"
	@grep -E '^db-.*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(CYAN)Utilitários$(RESET)\n"
	@grep -E '^(health|open).*:.*##' Makefile | \
		awk 'BEGIN{FS=":.*##"} {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@printf "\n$(YELLOW)Credenciais padrão:$(RESET) patient@example.com / Password123!\n"
	@printf "$(YELLOW)Frontend:$(RESET) http://localhost:3000  |  $(YELLOW)Backend:$(RESET) http://localhost:8000  |  $(YELLOW)Swagger:$(RESET) http://localhost:8000/docs\n\n"

# ─── Docker ───────────────────────────────────────────────────────────────────
up: ## Sobe todos os serviços em background (build se necessário)
	docker compose up --build -d

down: ## Para e remove todos os containers
	docker compose down

build: ## Reconstrói todas as imagens sem cache
	docker compose build --no-cache

restart: ## Reinicia todos os containers
	docker compose restart

logs: ## Acompanha logs de todos os serviços
	docker compose logs -f

logs-backend: ## Acompanha logs apenas do backend
	docker compose logs -f backend

logs-frontend: ## Acompanha logs apenas do frontend
	docker compose logs -f frontend

logs-db: ## Acompanha logs do PostgreSQL
	docker compose logs -f postgres

ps: ## Lista containers e seus status
	docker compose ps

clean: ## Para containers e remove volumes (apaga dados do banco)
	@printf "$(YELLOW)Isso vai apagar os dados do banco. Continuar? [y/N] $(RESET)"; \
	read ans; [ "$$ans" = "y" ] || [ "$$ans" = "Y" ] && \
	docker compose down -v || echo "Cancelado."

clean-all: ## Remove containers, volumes e imagens do projeto
	@printf "$(YELLOW)Isso vai apagar containers, volumes e imagens. Continuar? [y/N] $(RESET)"; \
	read ans; [ "$$ans" = "y" ] || [ "$$ans" = "Y" ] && \
	docker compose down -v --rmi local || echo "Cancelado."

# ─── Desenvolvimento local ────────────────────────────────────────────────────
install: install-frontend install-backend ## Instala dependências de frontend e backend

install-frontend: ## Instala dependências do frontend
	cd frontend && npm install

install-backend: ## Instala dependências do backend
	cd backend && npm install

dev: ## Sobe banco/redis via Docker e inicia frontend + backend localmente
	docker compose up postgres redis -d
	@printf "\n$(GREEN)Banco e Redis prontos. Iniciando serviços locais...$(RESET)\n"
	@$(MAKE) -j2 dev-backend dev-frontend

dev-frontend: ## Inicia o frontend em modo desenvolvimento (porta 3001)
	cd frontend && npm run dev

dev-backend: ## Inicia o backend em modo desenvolvimento (porta 8000)
	cd backend && npm run start:dev

# ─── Testes ───────────────────────────────────────────────────────────────────
test: test-backend test-frontend ## Roda todos os testes

test-frontend: ## Roda testes do frontend
	cd frontend && npm run test:run

test-backend: ## Roda testes unitários do backend
	cd backend && npm test -- --runInBand

test-coverage: ## Roda testes com relatório de cobertura
	cd frontend && npm run test:coverage
	cd backend && npm run test:cov

# ─── Qualidade de código ──────────────────────────────────────────────────────
lint: lint-frontend lint-backend ## Roda lint em frontend e backend

lint-frontend: ## Roda lint no frontend
	cd frontend && npm run lint

lint-backend: ## Roda lint no backend
	cd backend && npm run lint

# ─── Banco de dados ───────────────────────────────────────────────────────────
db-migrate: ## Cria e aplica novas migrations Prisma (dev)
	cd backend && npm run db:migrate

db-seed: ## Popula o banco com dados iniciais (seed)
	cd backend && npm run db:seed

db-studio: ## Abre o Prisma Studio para inspecionar o banco
	cd backend && npx prisma studio

# ─── Utilitários ─────────────────────────────────────────────────────────────
health: ## Verifica se os serviços estão respondendo
	@printf "$(CYAN)Backend:$(RESET)  "; curl -sf http://localhost:8000/health -H "X-API-Version: 1" -o /dev/null && printf " $(GREEN)OK$(RESET)\n" || printf " $(YELLOW)Offline$(RESET)\n"
	@printf "$(CYAN)Frontend:$(RESET) "; curl -sf http://localhost:3000 -o /dev/null && printf " $(GREEN)OK$(RESET)\n" || printf " $(YELLOW)Offline$(RESET)\n"
	@printf "$(CYAN)Postgres:$(RESET) "; docker compose exec postgres pg_isready -U postgres -q && printf " $(GREEN)OK$(RESET)\n" || printf " $(YELLOW)Offline$(RESET)\n"
	@printf "$(CYAN)Redis:$(RESET)    "; docker compose exec redis redis-cli ping | grep -q PONG && printf " $(GREEN)OK$(RESET)\n" || printf " $(YELLOW)Offline$(RESET)\n"

open: ## Abre frontend e Swagger no navegador
	open http://localhost:3000
	open http://localhost:8000/docs
