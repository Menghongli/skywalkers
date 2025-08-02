dev:
    cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

start:
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8001

install:
    cd backend && uv sync

test:
    cd backend && uv run pytest

clean:
    cd backend && rm -rf .pytest_cache __pycache__ .coverage
    find . -name "*.pyc" -delete

frontend-dev:
    cd frontend && npm start

frontend-build:
    cd frontend && npm run build

frontend-install:
    cd frontend && npm install