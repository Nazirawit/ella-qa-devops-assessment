# Environment Configuration Specification

**Service:** Ella API  
**Author:** QA / DevOps Engineering  
**Date:** October 2026  

---

## 1. Overview

The Ella API application consumes configuration variables through `@nestjs/config` and TypeORM CLI (`data-source.ts`). Sensitive parameters must never be committed to source control.

---

## 2. Environment Variables Matrix

| Variable Name | Description | Development (Local) | Staging | Testing / CI | Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | `development` | `staging` | `test` | `production` |
| `PORT` | HTTP port the application listens on | `4000` | `4000` (or injected by PaaS) | `4001` (ephemeral) | `80` / `443` / `4000` |
| `DB_HOST` | Hostname / IP address of PostgreSQL instance | `localhost` (or `db` in Docker) | `staging-db.internal` | `localhost` / `postgres` | `prod-db.aurora.aws` |
| `DB_PORT` | Port number of PostgreSQL instance | `5432` | `5432` | `5432` | `5432` |
| `DB_USERNAME` | Database role name | `postgres` | `ella_staging_svc` | `postgres` | `ella_prod_svc` |
| `DB_PASSWORD` | Database user password | `postgres` | Injected Secret | `postgres` | Managed Secret (e.g. AWS Secrets Manager) |
| `DB_DATABASE` | Database name | `ella` | `ella_staging` | `ella_test` | `ella_prod` |
| `DB_SYNCHRONIZE` | Auto schema generation (ORM) | `false` | `false` | `false` (migrations only) | `false` |
| `LOG_LEVEL` | Application logging verbosity | `debug` | `info` | `warn` / `silent` | `warn` / `error` |

---

## 3. Key Differences Across Environments

### Development (Local)
- **Host vs Container:** When running app locally with `npm run start:dev`, `DB_HOST=localhost`. When running both containers inside Docker Compose, `DB_HOST=db` (resolving via internal Docker network bridge).
- **Credentials:** Uses default local developer credentials (`postgres/postgres`).
- **Swagger Documentation:** Enabled on `/api` for rapid exploratory testing.

### Testing / CI Environment
- **Database:** Dedicated ephemeral test database (`ella_test`) or isolated PostgreSQL service container in GitHub Actions.
- **Data Isolation:** Fresh migrations are executed before test suites to ensure zero test pollution across runs.
- **Secrets:** Injected via GitHub Actions environment secrets (`${{ secrets.DB_PASSWORD }}`).

### Staging Environment
- **Mirroring Production:** Replicates production topology (managed RDS PostgreSQL instance, read replicas if applicable).
- **Sanitized Data:** Uses anonymized data dumps or synthetic seeds to test realistic volume without exposing PII.
- **Swagger:** Restricted or behind VPN/basic auth.

### Production Environment
- **Zero Hardcoded Secrets:** Passwords and keys must strictly be provisioned at runtime through a Secrets Manager (AWS SSM Parameter Store / Vault).
- **SSL / TLS:** Encrypted database connections (`ssl: { rejectUnauthorized: true }`).
- **Swagger UI:** Disabled in production to prevent exposing internal API endpoints.

