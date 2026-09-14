# WorkPilot AI - Backend Service

FastAPI REST API service for WorkPilot AI.

## Quick Start (Windows PowerShell)

```powershell
# 1. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 2. Start development server
uvicorn app.main:app --reload --port 8000
```

## Useful URLs
- API Root: http://localhost:8000/
- Health Check: http://localhost:8000/api/health
- Interactive Docs (Swagger): http://localhost:8000/docs
- Alternative Docs (ReDoc): http://localhost:8000/redoc

## Architecture (Step 1 Foundation)
- `app/main.py`: Application entry point with CORS and route mounting.
- `app/core/config.py`: Application settings managed via Pydantic Settings.
- `app/api/routes/health.py`: Health check endpoint.
- `app/api/router.py`: Aggregator for all API routes.
