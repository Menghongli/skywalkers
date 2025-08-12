# Development environment management
db-start:
    docker compose up -d postgres

db-stop:
    docker compose stop postgres

db-reset:
    docker compose down postgres
    docker volume rm skywalkers_postgres_data || true
    docker compose up -d postgres

db-logs:
    docker compose logs -f postgres

# Backend with local PostgreSQL
backend-dev:
    #!/usr/bin/env bash
    export $(cat .env.local | xargs)
    cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 --log-level debug

# Original backend command (uses DATABASE_URL from environment)
backend:
    cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 --log-level debug

# Full development environment
dev:
    #!/usr/bin/env bash
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    sleep 5
    echo "Running database migrations..."
    export $(cat .env.local | xargs)
    cd backend && uv run alembic upgrade head
    echo "✅ Development environment ready!"
    echo "Run 'just backend-dev' and 'just frontend' in separate terminals"

frontend:
    cd frontend && npm start


install:
    #!/usr/bin/env bash
    cd backend && uv sync &
    cd frontend && npm install

test:
    cd backend && uv run pytest

clean:
    cd backend && rm -rf .pytest_cache __pycache__ .coverage
    find . -name "*.pyc" -delete

# CLI commands (with local PostgreSQL)
fetch-ladder:
    #!/usr/bin/env bash
    export $(cat .env.local | xargs)
    cd backend && uv run fetch-ladder

update-ladder:
    #!/usr/bin/env bash
    export $(cat .env.local | xargs)
    cd backend && uv run update-ladder

fetch-fixtures:
    #!/usr/bin/env bash
    export $(cat .env.local | xargs)
    cd backend && uv run fetch-fixtures