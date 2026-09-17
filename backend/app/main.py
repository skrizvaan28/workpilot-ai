from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
from app.models import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[WorkPilot AI] Starting {settings.PROJECT_NAME} v{settings.VERSION} ({settings.ENVIRONMENT})")
    Base.metadata.create_all(bind=engine)
    yield
    print(f"[WorkPilot AI] Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="WorkPilot AI - Enterprise AI-Agent Workspace Backend",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes under /api (e.g. /api/health)
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["health"])
def health_alias():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "message": "WorkPilot AI API Foundation is running successfully.",
        "docs": "/docs",
        "health": "/api/health",
    }
