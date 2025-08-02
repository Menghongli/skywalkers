# Skywalkers Basketball Tracker 🏀

A web application for tracking basketball games and player statistics for the Skywalkers team.

## Features

- **Game Management**: Schedule games, record scores against opponents, and upload game videos
- **Player Roster**: Manage team roster with jersey numbers and player profiles  
- **Statistics Tracking**: Record basic player stats (points and fouls) for each game
- **Role-Based Access**: Team managers have full edit permissions, players have read-only access
- **Video Storage**: Upload and view game recordings

## Tech Stack

- **Backend**: FastAPI with SQLAlchemy, JWT authentication, uv for dependency management
- **Frontend**: React with TypeScript
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Railway (backend) + Vercel (frontend)

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
# Backend
just dev          # Start backend development server
just start        # Start backend production server
just install      # Install backend dependencies
just test         # Run backend tests
just clean        # Clean backend cache files

# Frontend  
just frontend-dev      # Start frontend development server
just frontend-build    # Build frontend for production
just frontend-install  # Install frontend dependencies
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (manager/player)
- `POST /auth/login` - Login user

### Games
- `GET /games` - List all games
- `POST /games` - Create new game (manager only)
- `PUT /games/{id}` - Update game (manager only)
- `DELETE /games/{id}` - Delete game (manager only)

### Players
- `GET /players` - List all players
- `GET /players/{id}` - Get player details

### Statistics
- `GET /stats/game/{game_id}` - Get stats for a game
- `GET /stats/player/{player_id}` - Get stats for a player
- `POST /stats` - Create player game stats (manager only)
- `PUT /stats/{id}` - Update player game stats (manager only)

## Database Models

### User
- Email, password, name, role (manager/player)

### Player
- User reference, jersey number

### Game
- Opponent name, date, scores, video URL

### PlayerGameStats
- Player reference, game reference, points, fouls

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
DATABASE_URL=sqlite:///./skywalkers.db  # or PostgreSQL URL for production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details