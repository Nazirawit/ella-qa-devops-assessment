# Test Cases: Users Module

**Module:** Users  
**Version:** 1.0.0  
**Test Type:** Functional, Negative, Boundary & Security Testing  
---

## 1. Acceptance Criteria (Derived Requirements)

- **AC-USR-01 (Create - Happy Path):** System shall create a new user when provided with a non-empty `name` (string) and a valid `email` (RFC compliant email format). Returns HTTP `201 Created` with generated numeric `id`, timestamps, and empty `transactions` array.
- **AC-USR-02 (Create - Required Fields):** System shall reject user creation if either `name` or `email` is missing, null, or empty string. Returns HTTP `400 Bad Request` with descriptive field validation messages.
- **AC-USR-03 (Create - Email Format):** System shall validate that `email` adheres to standard email format (containing `@` and valid domain). Invalid formats must be rejected with HTTP `400 Bad Request`.
- **AC-USR-04 (Create - Uniqueness):** User `email` must be globally unique. Attempting to register an already existing email must return HTTP `409 Conflict` with message `"Email already exists"`.
- **AC-USR-05 (Get All):** System shall return all users with HTTP `200 OK` including their relational `transactions`. Returns empty array `[]` when no users exist.
- **AC-USR-06 (Get By ID - Happy Path):** System shall return user entity with HTTP `200 OK` when valid, existing positive numeric `id` is provided.
- **AC-USR-07 (Get By ID - Non-existent):** System shall return HTTP `404 Not Found` when requesting an ID that does not exist in the database.
- **AC-USR-08 (Get By ID - Invalid Parameter):** System shall validate route parameters. Non-numeric IDs (e.g. `abc`, `-1`, `null`) must return HTTP `400 Bad Request`.
- **AC-USR-09 (Update - Happy Path):** System shall allow updating user details via `PUT /users/:id` for an existing user ID, returning HTTP `200 OK`.
- **AC-USR-10 (Update - Duplicate Email):** System shall reject update with HTTP `409 Conflict` if the new email belongs to another registered user.
- **AC-USR-11 (Update - Non-existent ID):** System shall return HTTP `404 Not Found` if updating a non-existent user ID.

---

## 2. Test Case Specification

### Category A: Positive Test Cases (Happy Path)

| Test ID | Test Case Title | Endpoint & Method | Test Data / Payload | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-USR-01** | Create user with valid name and unique email | `POST /users` | `{"name": "Abebe chala", "email": "Abebe.chala@example.com"}` | HTTP 201; JSON body contains assigned `id > 0`, `name`, `email`, `createdAt`, `updatedAt`, `transactions: []`. | Returned HTTP 201 with saved user. | **PASS** |
| **TC-USR-02** | Retrieve all users list | `GET /users` | None | HTTP 200; Array of users containing relational transactions. | Returned HTTP 200 with user list. | **PASS** |
| **TC-USR-03** | Retrieve existing user by valid ID | `GET /users/{id}` | Path param: Valid existing user ID (e.g. `1`) | HTTP 200; User object with matching ID and relational transactions. | Returned HTTP 200 with user data. | **PASS** |
| **TC-USR-04** | Update existing user name and email | `PUT /users/{id}` | Path param: Valid ID<br>`{"name": "Abebe Cooper", "email": "Abebe.cooper@example.com"}` | HTTP 200; Updated fields persisted and reflected in response. | Returned HTTP 200 with updated fields. | **PASS** |

---

### Category B: Negative Test Cases (Error Handling & Validation)

| Test ID | Test Case Title | Endpoint & Method | Test Data / Payload | Expected Result | Actual Result | Status / Bug |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-USR-05** | Create user with duplicate email | `POST /users` | Existing email: `{"name": "Abebe", "email": "Abebe.chala@example.com"}` | HTTP 409 Conflict; message: `"Email already exists"`. | **HTTP 201 Created** returned with dummy `id: 0`. | **FAIL (BUG-03)** |
| **TC-USR-06** | Create user with invalid email format (missing @ and domain) | `POST /users` | `{"name": "Nazrawit", "email": "not-an-email"}` | HTTP 400 Bad Request; message indicates email format error. | **HTTP 201 Created**; invalid string saved to database. | **FAIL (BUG-04)** |
| **TC-USR-07** | Create user with missing required field `name` | `POST /users` | `{"email": "valid@example.com"}` | HTTP 400 Bad Request; message: `"Name is required"`. | HTTP 400 Bad Request returned. | **PASS** |
| **TC-USR-08** | Create user with missing required field `email` | `POST /users` | `{"name": "nazrawit Kebeda"}` | HTTP 400 Bad Request; message: `"Email is required"`. | HTTP 400 Bad Request returned. | **PASS** |
| **TC-USR-09** | Create user with completely empty body | `POST /users` | `{}` | HTTP 400 Bad Request with validation errors for both fields. | HTTP 400 Bad Request returned. | **PASS** |
| **TC-USR-10** | Retrieve user with non-existent numeric ID | `GET /users/999999` | Path param: `999999` | HTTP 404 Not Found; message: `"User with ID 999999 not found"`. | HTTP 404 Not Found returned. | **PASS** |
| **TC-USR-11** | Retrieve user with non-numeric ID parameter | `GET /users/abc` | Path param: `abc` | HTTP 400 Bad Request (`ParseIntPipe` numeric validation). | **HTTP 500 Internal Server Error** due to unhandled `NaN` query error. | **FAIL (BUG-06)** |
| **TC-USR-12** | Update non-existent user ID | `PUT /users/999999` | Path param: `999999`<br>`{"name": "kebeda", "email": "kebeda@example.com"}` | HTTP 404 Not Found; message: `"User with ID 999999 not found"`. | HTTP 404 Not Found returned. | **PASS** |
| **TC-USR-13** | Update user email to another existing user's email | `PUT /users/{id}` | Payload with email matching another user | HTTP 409 Conflict; message: `"Email already exists"`. | HTTP 409 Conflict returned. | **PASS** |

---

### Category C: Boundary & Edge Cases

| Test ID | Test Case Title | Endpoint & Method | Test Data / Payload | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-USR-14** | Create user with extra / unwhitelisted fields | `POST /users` | `{"name": "User", "email": "valid@example.com", "isAdmin": true, "role": "SUPERADMIN"}` | HTTP 201; extraneous fields `isAdmin` and `role` are stripped by `whitelist: true`. | Stripped from database model. | **PASS** |
| **TC-USR-15** | Create user with empty strings `""` | `POST /users` | `{"name": "", "email": ""}` | HTTP 400 Bad Request; `"Name is required"` and `"Email is required"`. | HTTP 400 Bad Request returned. | **PASS** |
| **TC-USR-16** | Create user with extremely long string (boundary 255+ chars) | `POST /users` | `{"name": "A".repeat(300), "email": "long@domain.com"}` | Handled gracefully without DB truncation crash. | Handled or rejected gracefully. | **PASS** |
| **TC-USR-17** | Retrieve user with negative ID parameter | `GET /users/-5` | Path param: `-5` | HTTP 400 Bad Request or HTTP 404 Not Found. | HTTP 404 Not Found returned. | **PASS** |
| **TC-USR-18** | SQL Injection payload in name / email | `POST /users` | `{"name": "' OR '1'='1", "email": "sqli@test.com"}` | Parameterized by TypeORM safely, string stored literally. | Stored safely as literal string. | **PASS** |

