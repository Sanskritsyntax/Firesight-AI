# ==========================================
# Multi-Stage Production Dockerfile for FireSight AI
# Unified Full-Stack (FastAPI + React Vite)
# ==========================================

# ------------------------------------------
# Stage 1: Build React Frontend
# ------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies with caching
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source and build static bundle
COPY frontend/ ./
RUN npm run build

# ------------------------------------------
# Stage 2: Production Python Backend Runtime
# ------------------------------------------
FROM python:3.12-slim AS runner
WORKDIR /app

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install system dependencies if required (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend static bundle from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default HTTP port
EXPOSE 8000

# Healthcheck for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Launch production Uvicorn server with dynamic port support
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
