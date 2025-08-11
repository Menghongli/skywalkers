# Development Setup with PostgreSQL

This project now uses PostgreSQL for both local development and production to eliminate database differences.

## Prerequisites

- Docker and Docker Compose
- Python with `uv`
- Node.js and npm
- `just` command runner

## Quick Start

1. **Start the development environment:**
   ```bash
   just dev
   ```
   This will:
   - Start PostgreSQL in Docker
   - Run database migrations
   - Prepare the environment

2. **Run the backend (in one terminal):**
   ```bash
   just backend-dev
   ```

3. **Run the frontend (in another terminal):**
   ```bash
   just frontend
   ```

4. **Open your browser:** http://localhost:3000

## Database Management

### Start/Stop PostgreSQL
```bash
# Start PostgreSQL container
just db-start

# Stop PostgreSQL container  
just db-stop

# Reset database (deletes all data!)
just db-reset

# View database logs
just db-logs
```

### Database Connection
- **Host:** localhost
- **Port:** 5432
- **Database:** skywalkers  
- **Username:** skywalkers
- **Password:** skywalkers123

### Connect with psql
```bash
docker exec -it skywalkers-postgres psql -U skywalkers -d skywalkers
```

## CLI Commands

All CLI commands now use the local PostgreSQL database:

```bash
# Fetch team ladder
just fetch-ladder

# Update team ladder  
just update-ladder

# Fetch upcoming fixtures
just fetch-fixtures
```

## Environment Files

- `.env.local` - Local development environment variables
- `.env` - Production environment variables (not in git)

## Migration Commands

```bash
# Run migrations
cd backend && uv run alembic upgrade head

# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Downgrade migration
cd backend && uv run alembic downgrade -1
```

## Troubleshooting

### Database Connection Issues
1. Ensure Docker is running
2. Check if PostgreSQL container is healthy: `docker ps`
3. Restart database: `just db-reset`

### Migration Issues  
1. Check database is running: `just db-logs`
2. Reset database if needed: `just db-reset`
3. Run migrations: `just dev`

### Port Conflicts
If port 5432 is in use, modify `docker-compose.yml` to use a different port:
```yaml
ports:
  - "5433:5432"  # Use port 5433 on host
```
Then update `.env.local` accordingly.