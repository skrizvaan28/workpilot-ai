from fastapi import APIRouter
from app.api.routes import ai, analytics, auth, health, rewards, tasks, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(ai.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(tasks.router)
api_router.include_router(rewards.router)
api_router.include_router(analytics.router)
