# ==========================================
# Stage 1: Build & Install Dependencies
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into a wheels directory
RUN pip install --no-cache-dir --user -r requirements.txt

# ==========================================
# Stage 2: Final Light-weight Runtime Image
# ==========================================
FROM python:3.12-slim AS runner

WORKDIR /app

# Create non-root system user and group for ECR/production deployment
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -s /bin/bash appuser

# Copy installed python dependencies from builder stage
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Create cache directories for Flashcard and Quiz indices and set ownership
RUN mkdir -p /app/cache/flash_indexes /app/cache/quizz_indexes && \
    chown -R appuser:appgroup /app

# Copy application code with proper ownership
COPY --chown=appuser:appgroup app/ ./app/

# Expose microservice port (FastAPI standard)
EXPOSE 8080

# Switch to non-root user
USER appuser

# Run Uvicorn server in production mode
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
