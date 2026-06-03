import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import api_router
from core import validate_ai_runtime_config
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text

# Application instance for MedEdu API (Trigger deploy)
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


def run_db_migrations():
    database_url = os.getenv("DATABASE_URL")
    if not database_url or "localhost" in database_url or "127.0.0.1" in database_url:
        print("Skipping DB migrations (running in local mode or DATABASE_URL not set).")
        return

    try:
        # Construct url to default 'postgres' database to check/create target database
        base_url, db_name = database_url.rsplit("/", 1)
        db_name_clean = db_name.split("?")[0] if "?" in db_name else db_name
        postgres_url = f"{base_url}/postgres"

        # Connect to 'postgres' to check/create target database
        engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": db_name_clean}
            ).fetchone()
            if not exists:
                print(f"Database {db_name_clean} does not exist. Creating...")
                conn.execute(text(f'CREATE DATABASE "{db_name_clean}"'))
                print(f"Database {db_name_clean} created.")
            else:
                print(f"Database {db_name_clean} already exists.")
        engine.dispose()
    except Exception as e:
        print(f"Error checking/creating database: {e}")

    try:
        print("Running Alembic migrations...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Migrations completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def validate_runtime_config_on_startup():
    run_db_migrations()
    validate_ai_runtime_config()

# Register AWS Bedrock Agent Core router
from agentcore.router import router as agentcore_router
app.include_router(
    agentcore_router,
    prefix="/agentcore",
    tags=["AWS Bedrock Agent Core"]
)
