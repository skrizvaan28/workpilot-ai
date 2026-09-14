# WorkPilot AI

WorkPilot AI is an enterprise-grade AI-agent workspace. This repository contains the complete full-stack codebase, organized with a clean, modular, and production-ready architecture.

---

## 🗺️ Architecture Roadmap

| Step | Milestone | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Project Foundation** | React 18, TypeScript, Vite, Tailwind CSS, FastAPI, Uvicorn |  **Completed** |
| **Step 2** | **Database & Persistence** | PostgreSQL, pgvector, SQLAlchemy, Alembic migrations | ⏳ Planned Next |
| **Step 3** | **Authentication & Security** | JWT, OAuth2 Bearer, Role-Based Access Control | ⏳ Planned |
| **Step 4** | **AI & RAG Engine** | LLM API, Embeddings, Context Retriever, Agent Orchestrator | ⏳ Planned |
| **Step 5** | **Machine Learning** | scikit-learn analytics & predictive work insights | ⏳ Planned |
| **Step 6** | **Deployment & CI/CD** | Docker, Docker Compose, Cloud deployment | ⏳ Planned |

---

## 📁 Project Structure

```text
workpilot-ai/
├── backend/                  # FastAPI Python Backend
│   ├── .venv/                # Python Virtual Environment
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── health.py # Health-check endpoint (/api/health)
│   │   │   │   ├── auth.py   # [Step 3] Authentication routes
│   │   │   │   └── users.py  # [Step 3] User management routes
│   │   │   ├── deps.py       # [Step 3] Auth & DB dependencies
│   │   │   └── router.py     # Central API router
│   │   ├── core/
│   │   │   ├── config.py     # Pydantic Settings & environment config
│   │   │   └── security.py   # [Step 3] Password hashing & JWT logic
│   │   ├── crud/             # [Step 2/3] Database CRUD operations
│   │   ├── db/               # [Step 2] Database session & SQLAlchemy models base
│   │   ├── models/           # [Step 2] SQLAlchemy ORM database models
│   │   ├── schemas/          # [Step 2/3] Pydantic request/response schemas
│   │   └── main.py           # FastAPI application entry point
│   ├── .env.example          # Environment variable template
│   ├── .env                  # Local environment file
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React + TypeScript + Vite Frontend
│   ├── node_modules/         # Node dependencies
│   ├── src/
│   │   ├── components/
│   │   │   ├── FoundationHealthCheck.tsx # Live diagnostic & service status
│   │   │   ├── ProtectedRoute.tsx        # [Step 3] Route protection wrapper
│   │   │   ├── Sidebar.tsx               # Workspace sidebar
│   │   │   └── Topbar.tsx                # Workspace topbar
│   │   ├── context/
│   │   │   └── AuthContext.tsx           # [Step 3] Authentication state context
│   │   ├── lib/
│   │   │   └── api.ts                    # API client helper functions
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx             # Workspace dashboard page
│   │   │   ├── Login.tsx                 # Login page
│   │   │   └── Register.tsx              # Registration page
│   │   ├── App.tsx                       # Main router & landing page
│   │   ├── main.tsx                      # React root mount
│   │   └── index.css                     # Tailwind CSS & global styles
│   ├── .env.example          # Frontend environment template
│   ├── .env                  # Local frontend environment file
│   ├── package.json          # Node dependencies & npm scripts
│   ├── tailwind.config.js    # Tailwind styling configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration & /api reverse proxy
│
├── .gitignore                # Comprehensive Git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide (Windows PowerShell)

Follow these steps to run both the backend and frontend simultaneously.

### 1. Start the Backend (Terminal 1)

1. Open **Windows PowerShell** and navigate to the `backend` folder:
   ```powershell
   cd "c:\Users\SHAIK RIZVAAN\OneDrive\Attachments\worlpilot-ai\workpilot-ai\backend"
   ```

2. If you need to create or re-activate the virtual environment:
   ```powershell
   # Activate virtual environment
   .\.venv\Scripts\Activate.ps1
   ```
   > **Note for Windows Users**: If PowerShell gives an execution policy error (`running scripts is disabled on this system`), run:
   > ```powershell
   > Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   > ```
   > and then run the activate script again.

3. Install / verify dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

5. **Verify Backend is Running**:
   - **Root API**: [http://localhost:8000/](http://localhost:8000/)
   - **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
   - **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Alternative ReDoc Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Start the Frontend (Terminal 2)

1. Open a **second Windows PowerShell terminal** and navigate to the `frontend` folder:
   ```powershell
   cd "c:\Users\SHAIK RIZVAAN\OneDrive\Attachments\worlpilot-ai\workpilot-ai\frontend"
   ```

2. Install dependencies (already installed, but run if needed):
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. **Open in your browser**:
   - Navigate to [http://localhost:5173/](http://localhost:5173/)
   - You will see the **WorkPilot AI System Status** panel confirming:
     - Frontend: **Online**
     - Backend API: **Online** (with live ping to `/api/health`)
     - Architecture Roadmap status

---

## 🔍 API Endpoints (Step 1 Foundation)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root greeting and service discovery links |
| `GET` | `/api/health` | Health-check endpoint returning service status, version, and environment |
| `GET` | `/health` | Direct alias for `/api/health` |
| `GET` | `/docs` | Interactive Swagger documentation UI |
| `GET` | `/redoc` | OpenAPI ReDoc documentation UI |

---

## 🛠️ Verification & Build Commands

- **Frontend Type-Check & Build**:
  ```powershell
  cd frontend
  npm run build
  ```
- **Backend Test / Health Verification**:
  ```powershell
  cd backend
  .\.venv\Scripts\python -c "from fastapi.testclient import TestClient; from app.main import app; c = TestClient(app); print(c.get('/api/health').json())"
  ```
