# ==============================================================================
# Stage 1: Build and dependency installation stage
# ==============================================================================
FROM python:3.12-slim AS builder

# Prevent Python from writing .pyc files in the builder stage to keep build clean
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system compilation packages (in case any pip packages require native compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up a clean virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install python dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt


# ==============================================================================
# Stage 2: Final runtime stage
# ==============================================================================
FROM python:3.12-slim AS runner

# Optimize startup and output handling:
# - PYTHONDONTWRITEBYTECODE=1: avoids writing bytecode into the container filesystem
# - PYTHONUNBUFFERED=1: sends stdout/stderr straight to logs without buffering
# - PATH: points to the virtualenv binaries
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy virtual environment packages from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code
COPY . .

# Run as a non-privileged user for security and better resource utilization
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose the default backend port
EXPOSE 8000

# Command to run uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
