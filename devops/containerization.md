# Containerization & Build Troubleshooting Guide

**Service:** Ella API (NestJS + TypeORM + PostgreSQL 16)  
**Author:** QA / DevOps Engineering  
**Date:** October 2026  

---

## 1. Overview of Docker Configuration

The application is containerized using a multi-stage Docker build and managed via Docker Compose:
- **`Dockerfile`:** Uses `node:20-alpine` in two stages:
  - `builder` stage: Installs dependencies and runs `npm run build`.
  - `production` runtime stage: Copies compiled `/dist` directory and executes `node dist/src/main.js`.
- **`docker-compose.yml`:** Orchestrates the multi-container stack (`api` application container + `db` PostgreSQL 16 container).
- **`docker-compose.dev.yml`:** Spawns an isolated PostgreSQL container for local development against host-based Node.js (`npm run start:dev`).

---

## 2. Issues Identified & How They Were Diagnosed / Resolved

### Issue 1: Secret Leakage in Docker Image (`COPY .env ./`)
- **Diagnosis:** Inspection of line 23 in [`Dockerfile`](file:///c:/Users/Naz/Downloads/QA-Assessment-main/QA-Assessment-main/Dockerfile):
  ```dockerfile
  COPY .env ./
  ```
- **Problem:** Baking `.env` directly into Docker image layers exposes sensitive credentials (database passwords, tokens) to anyone with registry read access, and breaks container portability across environments.
- **Resolution:**
  - Removed `COPY .env ./` from the `Dockerfile`.
  - Injected environment variables at runtime via `env_file: .env` in `docker-compose.yml` or container orchestrator secrets (e.g. AWS Secrets Manager, GitHub Secrets).

---

### Issue 2: Redundant Package Installs & Image Bloat
- **Diagnosis:** Inspection of line 8 and line 19 in `Dockerfile`:
  ```dockerfile
  RUN npm install --legacy-peer-deps
  RUN npm install typeorm@^0.3.27 --legacy-peer-deps
  ...
  RUN npm install --legacy-peer-deps
  ```
- **Problem:** Installing TypeORM twice in the builder stage is redundant. In the runner stage, running `npm install` without pruning installs unnecessary `devDependencies` (e.g., Jest, ESLint, TypeScript, ts-node), bloating the final image.
- **Resolution:**
  - Builder stage runs `npm ci --legacy-peer-deps`.
  - Runtime stage runs `npm ci --omit=dev --legacy-peer-deps` to keep production image lightweight.

---

### Issue 3: Container Dependency Race Condition (API starting before DB is ready)
- **Diagnosis:** When running `docker compose up -d`, PostgreSQL takes several seconds to initialize its storage directory and accept TCP sockets on port `5432`. If the NestJS container attempts connection before PostgreSQL is ready, TypeORM crashes with `ECONNREFUSED`.
- **Diagnosis & Fix:**
  - In `docker-compose.yml`, a healthcheck is configured on the `db` service:
    ```yaml
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME} -d ${DB_DATABASE}']
      interval: 5s
      timeout: 5s
      retries: 10
    ```
  - The `api` service is set to wait for health condition:
    ```yaml
    depends_on:
      db:
        condition: service_healthy
    ```

---

### Issue 4: Running Containers as Root User
- **Diagnosis:** By default, Alpine containers run as `root` (UID 0), posing a container breakout security vulnerability.
- **Resolution:**
  - Add `USER node` before the `CMD` directive in `Dockerfile` to enforce least-privilege execution.

---

## 3. Recommended Production `Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# Run as non-privileged node user
USER node

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
```

