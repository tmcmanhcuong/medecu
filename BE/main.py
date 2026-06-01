from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import api_router
from core import validate_ai_runtime_config

# Application instance for MedEdu API
app = FastAPI(title="MedEdu")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def validate_runtime_config_on_startup():
    validate_ai_runtime_config()

# Register AWS Bedrock Agent Core router
from agentcore.router import router as agentcore_router
app.include_router(
    agentcore_router,
    prefix="/agentcore",
    tags=["AWS Bedrock Agent Core"]
)
