# Service Deployment & Operations Runbook

**Service:** Ella API Backend  
**Maintainers:** DevOps / QA Team  
**Last Updated:** October 2026  
**Status:** Active  

---

## 1. Quick Reference & Health Checks

- **Health Endpoint:** `GET /health`
  ```bash
  curl -i http://localhost:4000/health
  ```
  Expected: `HTTP 200 OK` with JSON:
  ```json
  {
    "statusCode": 200,
    "status": "healthy",
    "database": "up",
    "uptime": 124.5
  }
  ```
- **Swagger Documentation:** `http://localhost:4000/api`

---

## 2. Standard Deployment Procedures

### 2.1 Local / Development Build & Deploy
1. **Bring up Database:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
2. **Apply Database Migrations:**
   ```bash
   npm run migration:run
   ```
3. **Start Application:**
   ```bash
   npm run start:dev
   ```

### 2.2 Full Container Stack Deployment (Docker Compose)
1. **Build and launch with fresh images:**
   ```bash
   docker compose up -d --build
   ```
2. **Verify running containers:**
   ```bash
   docker compose ps
   ```
3. **Verify container logs:**
   ```bash
   docker compose logs -f api
   ```

---

## 3. Rollback Procedures

If a deployment fails health checks or introduces critical regressions:

### 3.1 Container Version Rollback
1. Stop running broken containers:
   ```bash
   docker compose down
   ```
2. Check out the previous known-good git tag/commit:
   ```bash
   git checkout <PREVIOUS_STABLE_TAG>
   ```
3. Re-deploy the stable release:
   ```bash
   docker compose up -d --build
   ```

### 3.2 Database Migration Rollback
If the failed deployment ran a schema migration that needs reversal:
```bash
npm run migration:revert
```

---

## 4. Common Incidents & Troubleshooting Guide

### Incident 1: `ECONNREFUSED` / Database Connection Error on Startup
- **Symptoms:** Application container crashes in crash-loop with `error: connect ECONNREFUSED 127.0.0.1:5432` or `db:5432`.
- **Root Cause:** PostgreSQL container is still initializing or `DB_HOST` is incorrectly set.
- **Resolution:**
  1. If running inside Docker Compose, confirm `DB_HOST=db` in `.env` or compose environment.
  2. If running on host Node.js, confirm `DB_HOST=localhost`.
  3. Verify database health:
     ```bash
     docker exec -it shop-db pg_isready -U postgres
     ```

### Incident 2: Port Conflict (`listen EADDRINUSE: address already in use :::4000`)
- **Symptoms:** App fails to start because port 4000 is occupied by a dangling process.
- **Resolution:**
  - Find PID occupying port 4000:
    ```powershell
    Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
    ```
  - Stop the conflicting process or change `PORT=4001` in `.env`.

### Incident 3: Unique Constraint Collision / 409 Conflict
- **Symptoms:** Client tests fail on creation endpoints.
- **Resolution:**
  - Reset test database state:
    ```bash
    npm run schema:drop
    npm run migration:run
    ```

