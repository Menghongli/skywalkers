FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy backend files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy backend application code
COPY backend/ ./

# Set environment variable for port
ENV PORT=8000

# Start command
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]