from fastapi import FastAPI

from ai_service.routers import health

app = FastAPI(title="p-ferm AI Service", version="0.1.0")

app.include_router(health.router)
