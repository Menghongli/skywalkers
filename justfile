backend:
    cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

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

ladder:
    cd backend && uv run ladder

update-ladder:
    #!/usr/bin/env bash
    cd backend
    echo "🔄 Running scheduled ladder update..."
    uv run python -c 'from app.services.ladder_service import scheduled_ladder_update; import logging; logging.basicConfig(level=logging.INFO); result = scheduled_ladder_update(); print("✅ Success!" if result else "❌ Failed")'