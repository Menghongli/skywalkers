# Skywalkers Basketball Tracker 🏀

<div align="center">
  <img src="frontend/public/logo192.png" alt="Skywalkers Logo" width="200" height="200">
</div>

A web application for tracking basketball games and player statistics for the Skywalkers team.

## Features

- **Game Management**: Schedule games, record scores against opponents, and add video recordings
- **Video Player**: Integrated video player supporting YouTube links, direct video files (MP4, WebM, OGG), and external links
- **Player Roster**: Manage team roster with jersey numbers and player profiles  
- **Statistics Tracking**: Record basic player stats (points and fouls) for each game with automated scraping capability
- **Ladder Integration**: Real-time league standings and position tracking
- **Fixtures Management**: Automated fixture updates and game scheduling
- **Role-Based Access**: Team managers have full edit permissions, players have read-only access
- **Modern UI**: Clean, responsive design with dark/light theme support and custom branding

## Tech Stack

### Backend
- **Framework**: FastAPI with async support
- **Database**: SQLAlchemy ORM with Alembic migrations
- **Authentication**: JWT tokens with secure password hashing
- **Package Management**: uv for fast Python dependency management
- **Web Scraping**: BeautifulSoup4 + Requests for external data integration
- **Task Scheduling**: APScheduler for automated data updates

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router for navigation
- **State Management**: Context API for global state
- **Styling**: CSS-in-JS with CSS variables for theming
- **HTTP Client**: Axios with interceptors for API communication
- **Video Player**: Custom component with multi-format support

### Database
- **Primary Database**: PostgreSQL for both development and production
- **Local Development**: Docker Compose for PostgreSQL container setup
- **Production**: Managed PostgreSQL on Railway platform

### Deployment & DevOps
- **Backend Hosting**: Railway with automatic deployments
- **Frontend Hosting**: Vercel with continuous deployment
- **Task Runner**: Just for development workflow automation
- **Version Control**: Git with conventional commits

## Quick Start

### Prerequisites

- [uv](https://docs.astral.sh/uv/) for Python dependency management
- [Node.js](https://nodejs.org/) for React frontend
- [just](https://github.com/casey/just) for task runner (optional)

### Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd skywalkers
   ```

2. **Start the backend:**
   ```bash
   just dev
   # or manually:
   cd backend && uv run uvicorn app.main:app --reload --port 8001
   ```

3. **Start the frontend:**
   ```bash
   just frontend-dev
   # or manually:
   cd frontend && npm start
   ```

4. **Access the application:**
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs
   - Frontend: http://localhost:3000

### Available Commands

```bash
# Database
just db-start         # Start PostgreSQL Docker container
just db-stop          # Stop PostgreSQL container
just db-reset         # Reset database with fresh data
just db-logs          # View database logs

# Backend
just backend-dev      # Start backend with PostgreSQL (recommended)
just dev             # Start backend development server (legacy SQLite fallback)
just install         # Install backend dependencies
just clean           # Clean backend cache files

# Frontend  
just frontend-dev      # Start frontend development server
just frontend-build    # Build frontend for production
just frontend-install  # Install frontend dependencies
```

## Deployment

### Backend to Railway

1. Connect your GitHub repository to Railway
2. Set root directory to `backend`
3. Add environment variables:
   - `SECRET_KEY` - JWT secret key
   - `DATABASE_URL` - PostgreSQL connection string (auto-provided by Railway)

### Frontend to Vercel

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build settings are auto-detected

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/skywalkers  # Local PostgreSQL
# For production, Railway auto-provides DATABASE_URL
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
