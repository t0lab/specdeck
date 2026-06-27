# SpecDeck — developer tasks. The stack runs in Docker (hot-reload via
# docker-compose.override.yml); these targets shell into the running containers.
# Run `make help` for the list.

# Run an alembic command inside the gateway container (cwd = the package root
# that holds alembic.ini).
GW := docker compose exec -T gateway sh -lc
ALEMBIC := cd /app/gateway && uv run alembic

.DEFAULT_GOAL := help
.PHONY: help migrate migrate-down migrate-base migrate-rev migrate-history \
        migrate-current db-reset gw-test gw-shell

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## ── Migrations (Alembic, gateway-owned) ──────────────────────────────────────

migrate: ## Apply all pending migrations (alembic upgrade head)
	$(GW) "$(ALEMBIC) upgrade head"

migrate-down: ## Roll back one migration (alembic downgrade -1)
	$(GW) "$(ALEMBIC) downgrade -1"

migrate-base: ## Roll back ALL migrations (alembic downgrade base)
	$(GW) "$(ALEMBIC) downgrade base"

migrate-rev: ## Autogenerate a revision: make migrate-rev m="describe change"
	@test -n "$(m)" || { echo "usage: make migrate-rev m=\"message\""; exit 1; }
	$(GW) "$(ALEMBIC) revision --autogenerate -m '$(m)'"

migrate-history: ## Show migration history
	$(GW) "$(ALEMBIC) history --verbose"

migrate-current: ## Show the currently-applied revision
	$(GW) "$(ALEMBIC) current"

db-reset: ## DANGER: drop the public schema and re-apply all migrations (dev only)
	docker compose exec -T postgres psql -U $${POSTGRES_USER:-specdeck} -d $${POSTGRES_DB:-specdeck} \
		-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(GW) "$(ALEMBIC) upgrade head"

## ── Gateway dev ──────────────────────────────────────────────────────────────

gw-test: ## Run the gateway test suite (pytest) in the container
	$(GW) "cd /app/gateway && uv run pytest -q"

gw-shell: ## Open a shell in the gateway container
	docker compose exec gateway sh
