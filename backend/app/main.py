import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, games, players, stats, admin, ladder, stats_scraper, fixtures
from .middlewares import ManagerAuthMiddleware
from .scheduler import get_scheduler

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Skywalkers Basketball Tracker", version="1.0.0", redirect_slashes=False)

# Initialize scheduler on startup
@app.on_event("startup")
async def startup_event():
    # Initialize the scheduler
    scheduler = get_scheduler()
    print("Scheduler initialized with scheduled tasks")

# Add manager auth middleware
app.add_middleware(ManagerAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(games.router)
app.include_router(players.router)
app.include_router(stats.router)
app.include_router(stats_scraper.router)
app.include_router(ladder.router)
app.include_router(fixtures.router)

@app.get("/")
async def root():
    return {"message": "Skywalkers Basketball Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}