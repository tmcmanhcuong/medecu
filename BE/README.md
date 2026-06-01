## Folder structure for a FastAPI project:
``` bash
app/
├── main.py                 # entrypoint
├── requirements.txt        # dependencies
├── alembic.ini            # alembic configuration
├── alembic/               # database migrations
│   ├── README             # alembic usage guide
│   ├── env.py            # alembic environment
│   ├── script.py.mako    # migration template
│   └── versions/         # migration files
│       ├── 001_init_tables.py
│       └── 002_create_seed_users.py
│
├── core/                   # core config, startup
│   ├── config.py
│   ├── security.py
│   ├── database.py
│   ├── logging.py
│   └── events.py
│
├── api/
│   ├── __init__.py
│   ├── deps.py             # dependencies chung
│   ├── v1/                 # versioning API
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── endpoints/
│   │   │   ├── users.py
│   │   │   ├── auth.py
│   │   │   ├── books.py
│   │   │   ├── notes.py
│   │   │   └── quizzes.py
│
├── models/                 # ORM models
│   ├── __init__.py
│   ├── user.py
│   ├── books.py
│   ├── note.py
│   └── quizz.py
│
├── schemas/                # Pydantic schemas
│   ├── __init__.py
│   ├── user.py
│   ├── books.py
│   ├── note.py
│   └── quizz.py
│
├── repositories/           # DB access layer
│   ├── __init__.py
│   ├── user.py
│   ├── books.py
│   ├── note.py
│   └── quizz.py
│
├── utils/                  # helper functions
│   ├── __init__.py
│   ├── convert_pdf_2_index.py
│   ├── upload_file.py
│   └── upload_pdf.py
│
├── cache/                  # cached data
│   ├── markdown_indexes/
│   └── quizz_indexes/
│
├── mock/                   # mock data
│   └── quizz.json
│
└── tests/
    ├── __init__.py
    ├── test_users.py
    └── test_books.py
```

### How to run?: 
1. Install dependencies:
	 ```bash
	 pip install -r requirements.txt
	 ```
2. Set environment variables:
	 ```bash
	 DATABASE_URL=postgresql://postgres:123@192.168.1.204:8511/MedEdu # connecting with me to get address
	 MARKER_URL=http://localhost:8001/marker
	 BOOK_ENTITIES_INDEX_PATH=./cache
	 APP_ENV=development
	 FILE_STORAGE_MODE=local
	 DOCUMENT_UPLOAD_DIR=./cache/documents
	 EXTRACTION_MODE=local
	 EXTRACTION_SERVICE_URL=http://localhost:8001/marker
	 ```

	Production notes:
	- `FILE_STORAGE_MODE=s3` requires `S3_BUCKET_NAME`.
	- `EXTRACTION_MODE=remote` requires `EXTRACTION_SERVICE_URL`.
	- In non-development environments, missing required values fail fast on startup.

3. Setup database with Alembic migrations:
	 ```bash
	 # For new users or after pulling code changes
	 alembic upgrade head
	 ```

4. Running marker server if needed:
	 ```bash
	 marker_server --port 8001 # use SSH tunnel on my Desktop to use marker service
	 ```

5. Start the FastAPI server:
	 ```bash
	 fastapi dev main.py
	 ```

### Database Migrations (Alembic):
For detailed Alembic usage, see [alembic/README](./alembic/README)

**Quick commands:**
- Apply all migrations: `alembic upgrade head`
- Create new migration: `alembic revision -m "description"`
- Check current status: `alembic current`
- View migration history: `alembic history`

### Study Foundation Ownership
- Backend persists foundational study resources in application storage: `books`, `document_extracted_content`, `notes`, `study_activity_history`.
- Future AI workflows (including `n8n`) must consume and update these resources through backend APIs instead of replacing ownership of persistence logic.

