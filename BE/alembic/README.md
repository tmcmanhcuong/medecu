# Alembic Quick Reference

Alembic manages database schema migrations for SQLAlchemy.

## Table of Contents
- [Alembic Quick Reference](#alembic-quick-reference)
  - [Table of Contents](#table-of-contents)
  - [Key Files](#key-files)
  - [Essential Commands](#essential-commands)
    - [Create Migration](#create-migration)
    - [Apply Migrations](#apply-migrations)
    - [Rollback Migrations](#rollback-migrations)
    - [Check Status](#check-status)
  - [Creating Seed Data](#creating-seed-data)
    - [Step 1: Generate Migration](#step-1-generate-migration)
    - [Step 2: Edit Upgrade Function](#step-2-edit-upgrade-function)
    - [Step 3: Edit Downgrade Function](#step-3-edit-downgrade-function)
    - [Step 4: Apply Migration](#step-4-apply-migration)

## Key Files

**alembic.ini** - Main configuration file containing database URL and settings

**alembic/env.py** - Environment script that runs when Alembic executes, handles database connection

**alembic/versions/** - Directory containing all migration files (auto-generated)

**alembic/script.py.mako** - Template file for generating new migration scripts

## Essential Commands

### Create Migration
```bash
alembic revision -m "your_description"
```

### Apply Migrations
```bash
alembic upgrade head           # Apply all pending migrations
alembic upgrade <revision_id>  # Apply up to specific revision
```

### Rollback Migrations
```bash
alembic downgrade -1           # Rollback one revision
alembic downgrade <revision_id> # Rollback to specific revision
alembic downgrade base         # Rollback all migrations
```

### Check Status
```bash
alembic current    # Show current revision
alembic history    # Show migration history
```

## Creating Seed Data

To add initial data through migrations:

### Step 1: Generate Migration
```bash
alembic revision -m "seed_users"
```

### Step 2: Edit Upgrade Function
```python
def upgrade() -> None:
    users_table = sa.table(
        "users",
        sa.column("username", sa.String),
        sa.column("email", sa.String),
        sa.column("full_name", sa.String),
        sa.column("password", sa.String),
    )
    op.bulk_insert(users_table, [
        {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "password123",
        }
    ])
```

### Step 3: Edit Downgrade Function
```python
def downgrade() -> None:
    op.execute("DELETE FROM users WHERE username = 'admin'")
```

### Step 4: Apply Migration
```bash
alembic upgrade head
```
