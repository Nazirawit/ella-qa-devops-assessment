# Defect Tracking Report (BUGS.md)

## Defect Summary Dashboard

| Bug ID | Module | Endpoint | Severity | Priority | Title |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Transactions | `POST /transactions` | **Critical** |  Urgent | Inventory quantity increments instead of decrementing upon purchase |
| **BUG-02** | Products | `PUT /products/:id` | **Critical** |  Urgent | Updating product overwrites `price` with `quantity` value and ignores price |
| **BUG-03** | Users | `POST /users` | **High** |  - High | Duplicate user registration returns `201 Created` with `id: 0` instead of `409 Conflict` |
| **BUG-04** | Users | `POST /users` | **High** |  - High | Missing email format validation allows arbitrary non-email strings |
| **BUG-05** | Products | `POST /products` | **Medium** |  - High | Products can be created with negative price |
| **BUG-06** | All Modules | `GET /:id`, `PUT /:id` | **Medium** | - Medium | Non-numeric route parameters trigger unhandled TypeORM error returning `500 Internal Server Error` |
| **BUG-07** | Transactions | `POST /transactions` | **Medium** | - Medium | Allows purchasing products marked as `OUT_OF_STOCK` if stock is not zero |
| **BUG-08** | Transactions | `POST /transactions` | **High** |  - High | Lack of database transaction isolation allows concurrency race conditions on stock |
