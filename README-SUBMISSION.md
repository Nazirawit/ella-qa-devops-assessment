# Ella API — QA & DevOps Intern Assessment Submission

**Candidate Submission**  
**Role:** QA / DevOps Intern  
**Date:** October 2026  
**Repository Structure:**
```text
├── .github/workflows/
│   └── ci.yml                            # GitHub Actions CI workflow (lint, build, test)
├── qa/
│   ├── BUGS.md                           # Comprehensive defect report (8 bugs logged)
│   ├── test-cases-users.md               # Acceptance criteria & 18 test cases for Users module
│   ├── postman/
│   │   └── Ella_API_Users.postman_collection.json  # Postman test collection with scripts
│   └── k6/
│       └── users-load-test.js            # k6 performance & load testing script
├── devops/
│   ├── containerization.md               # Docker analysis, troubleshooting, and best practices
│   ├── environments.md                   # Dev, Staging, Testing environment matrix
│   ├── runbook.md                        # Deployment, rollback, and incident runbook
│   └── cloud-deployment.md               # Beginner-level AWS ECS Fargate + RDS plan
├── src/
│   ├── app.controller.ts                 # Added GET /health endpoint
│   ├── app.service.ts                    # Database health connectivity check
│   └── users/
│       └── users.service.spec.ts         # Automated Jest unit test suite (11/11 passing)
└── README-SUBMISSION.md                  # This submission summary
```

---

## 1. Track A — Quality Assurance Summary

### 1.1 Exploratory & Functional Bug Hunting
During API exploratory testing and code inspection across all modules (Users, Products, Transactions), **8 defects** were identified, categorized, and documented in [`qa/BUGS.md`](qa/BUGS.md):
- **BUG-01 (Critical):** Inventory quantity increments (`+=`) instead of decrementing (`-=`) on purchases in `TransactionsService`.
- **BUG-02 (Critical):** Updating product overwrites `price` with `quantity` value in `ProductsService.update()`.
- **BUG-03 (High):** Duplicate user registration returns `201 Created` with ghost `{ id: 0 }` instead of `409 Conflict`.
- **BUG-04 (High):** Missing `@IsEmail()` validation allows arbitrary strings as emails in `CreateUserDto`.
- **BUG-05 (Medium):** Negative product prices allowed in `CreateProductDto`.
- **BUG-06 (Medium):** Non-numeric ID parameters in route params cause unhandled TypeORM `500 Internal Server Error` instead of `400 Bad Request`.
- **BUG-07 (Medium):** Allows purchasing out-of-stock products if quantity > 0.
- **BUG-08 (High / Architectural):** Missing database transaction isolation in transactions, allowing concurrency race conditions.

### 1.2 Test Cases (Users Module)
Derived from acceptance criteria, 18 manual test cases covering Positive (Happy Path), Negative (Validation & Error paths), and Boundary/Edge cases are documented in [`qa/test-cases-users.md`](qa/test-cases-users.md).

### 1.3 Automated Unit Tests (Jest)
Written in [`src/users/users.service.spec.ts`](src/users/users.service.spec.ts) with full repository mocking.
- **Run command:** `npm test`
- **Result:** 11 passed across `create`, `findAll`, `findOne`, and `update`.

### 1.4 Postman API Collection
An exportable Postman collection is located at [`qa/postman/Ella_API_Users.postman_collection.json`](qa/postman/Ella_API_Users.postman_collection.json) featuring pre-request dynamic data generators and automated assertion tests (`pm.test`).

### 1.5 Performance Testing (k6)
Load test script located at [`qa/k6/users-load-test.js`](qa/k6/users-load-test.js) targeting `GET /users` and `POST /users` with 20 virtual users and p95 latency thresholds `< 250ms`.

---

## 2. Track B — DevOps Summary

### 2.1 CI/CD Pipeline
Configured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
- Triggers on push and pull requests to `main` / `master`.
- Enforces strict quality gates: **dependency installation (`npm ci`)**, **ESLint (`npm run lint`)**, **TypeScript build (`npm run build`)**, and **Unit testing (`npm test`)**.
- The pipeline immediately halts and fails if any step fails.

### 2.2 Containerization & Docker Troubleshooting
Documented in [`devops/containerization.md`](devops/containerization.md).
- Diagnosed potential secret leaks (`COPY .env ./`), redundant dev dependencies in production stages, container race conditions, and root user execution. Provided production-grade multi-stage `Dockerfile`.

### 2.3 Environment Configuration
Documented in [`devops/environments.md`](devops/environments.md).
- Created a configuration matrix across **Development**, **Staging**, **Testing / CI**, and **Production**.

### 2.4 Health Check Endpoint
Implemented `GET /health` in [`src/app.controller.ts`](src/app.controller.ts) and [`src/app.service.ts`](src/app.service.ts) providing real-time uptime, process status, and active PostgreSQL connectivity verification.

### 2.5 Deployment Runbook
Documented in [`devops/runbook.md`](devops/runbook.md), providing standard deployment steps, container rollback, migration reversion, and common operational incident handling.

### 2.6 Cloud Deployment Architecture
Documented in [`devops/cloud-deployment.md`](devops/cloud-deployment.md), proposing a beginner-friendly, secure, serverless AWS deployment using **AWS ECS Fargate**, **Amazon RDS PostgreSQL Multi-AZ**, and **Application Load Balancer**.

