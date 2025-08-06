backend:
    cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

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