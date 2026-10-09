# Defect Tracking Report (BUGS.md)

**Project:** Ella E-Commerce API  
**Author:** QA Engineering  
**Date:** October 2026  
**Environment:** Local Docker Development (PostgreSQL 16 + NestJS 11 on Node 20)  
**Base URL:** `http://localhost:4000`

---

## Defect Summary Dashboard

| Bug ID | Module | Endpoint | Severity | Priority | Title |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Transactions | `POST /transactions` | **Critical** | P1 - Urgent | Inventory quantity increments instead of decrementing upon purchase |
| **BUG-02** | Products | `PUT /products/:id` | **Critical** | P1 - Urgent | Updating product overwrites `price` with `quantity` value and ignores `dto.price` |
| **BUG-03** | Users | `POST /users` | **High** | P2 - High | Duplicate user registration returns `201 Created` with `id: 0` instead of `409 Conflict` |
| **BUG-04** | Users | `POST /users` | **High** | P2 - High | Missing email format validation allows arbitrary non-email strings |
| **BUG-05** | Products | `POST /products` | **Medium** | P2 - High | Products can be created with negative price |
| **BUG-06** | All Modules | `GET /:id`, `PUT /:id` | **Medium** | P3 - Medium | Non-numeric route parameters trigger unhandled TypeORM error returning `500 Internal Server Error` |
| **BUG-07** | Transactions | `POST /transactions` | **Medium** | P3 - Medium | Allows purchasing products marked as `OUT_OF_STOCK` if stock is not zero |
| **BUG-08** | Transactions | `POST /transactions` | **High** | P2 - High | Lack of database transaction isolation allows concurrency race conditions on stock |

---

## Detailed Bug Reports

### BUG-01: Inventory quantity increments instead of decrementing upon purchase
- **ID:** BUG-01
- **Module:** Transactions
- **Severity:** Critical (Data Integrity / Financial Risk)
- **Priority:** P1 - Urgent
- **Endpoint:** `POST /transactions`
- **Component File:** `src/transactions/transactions.service.ts` (Line 61)
- **Description:**  
  When an order/transaction is created, the system increments the product's available quantity instead of deducting the ordered quantity.
- **Steps to Reproduce:**
  1. Retrieve product stock for ID `2` via `GET /products/2` (Assume current `quantity` is 5).
  2. Send a `POST /transactions` request with payload:
     ```json
     {
       "userId": 1,
       "productId": 2,
       "quantity": 2
     }
     ```
  3. Verify the transaction creation responds with `201 Created`.
  4. Query `GET /products/2` to verify remaining quantity.
- **Expected Result:**  
  Product quantity should be updated to `3` (`5 - 2 = 3`).
- **Actual Result:**  
  Product quantity increases to `7` (`5 + 2 = 7`).
- **Root Cause:**  
  In `transactions.service.ts`:
  ```typescript
  product.quantity += dto.quantity; // Incorrect operator: '+' used instead of '-'
  ```
- **Suggested Fix:**  
  Change `product.quantity += dto.quantity;` to `product.quantity -= dto.quantity;`.

---

### BUG-02: Updating product overwrites `price` with `quantity` value and ignores `dto.price`
- **ID:** BUG-02
- **Module:** Products
- **Severity:** Critical (Pricing & Revenue Risk)
- **Priority:** P1 - Urgent
- **Endpoint:** `PUT /products/:id`
- **Component File:** `src/products/products.service.ts` (Line 111)
- **Description:**  
  When updating a product, the service assigns `dto.quantity` to `product.price`. Any price sent in the update payload is ignored, corrupting the product's unit price in the database.
- **Steps to Reproduce:**
  1. Create a product with `name: "Monitor"`, `price: 300.00`, `quantity: 10`.
  2. Issue a `PUT /products/{id}` request with:
     ```json
     {
       "name": "Monitor",
       "price": 350.00,
       "quantity": 4
     }
     ```
  3. Inspect the updated product data in response.
- **Expected Result:**  
  `price` should be updated to `350.00` and `quantity` should be `4`.
- **Actual Result:**  
  Both `price` and `quantity` become `4`. The price was overwritten with quantity `4`.
- **Root Cause:**  
  In `products.service.ts`:
  ```typescript
  product.price = dto.quantity ?? product.price; // Typo: references dto.quantity instead of dto.price
  ```
- **Suggested Fix:**  
  Replace with `product.price = dto.price ?? product.price;`.

---

### BUG-03: Duplicate user registration returns `201 Created` with `id: 0` instead of `409 Conflict`
- **ID:** BUG-03
- **Module:** Users
- **Severity:** High (Contract Violation & Ghost Entity)
- **Priority:** P2 - High
- **Endpoint:** `POST /users`
- **Component File:** `src/users/users.service.ts` (Lines 31-40)
- **Description:**  
  When a user with an already registered email is submitted, the backend intercepts Postgres unique constraint violation `23505` and returns `201 Created` with a ghost object having `id: 0` instead of failing with an HTTP 409 Conflict.
- **Steps to Reproduce:**
  1. Send `POST /users` with:
     ```json
     {
       "name": "Alice",
       "email": "alice@example.com"
     }
     ```
     Response: `201 Created` with `id: 1`.
  2. Send the exact same request again with `"email": "alice@example.com"`.
- **Expected Result:**  
  HTTP `409 Conflict` with error message `"Email already exists"`.
- **Actual Result:**  
  HTTP `201 Created` with body:
  ```json
  {
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "name": "Alice",
      "email": "alice@example.com",
      "id": 0,
      "transactions": []
    }
  }
  ```
  No user is inserted into the database, but client receives a false success indicator with `id: 0`.
- **Root Cause:**  
  ```typescript
  if (error instanceof QueryFailedError && (error as any).code === '23505') {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: { ...dto, id: 0, transactions: [] } as unknown as User,
    };
  }
  ```
- **Suggested Fix:**  
  Throw `new ConflictException('Email already exists');` inside the catch block (matching the behavior already present in `UsersService.update()`).

---

### BUG-04: Missing email format validation allows arbitrary non-email strings
- **ID:** BUG-04
- **Module:** Users
- **Severity:** High (Data Validation)
- **Priority:** P2 - High
- **Endpoint:** `POST /users`
- **Component File:** `src/users/dto/create-user.dto.ts` (Lines 8-9)
- **Description:**  
  `CreateUserDto` only decorates `email` with `@IsNotEmpty()`, omitting `@IsEmail()`. As a result, non-email strings are accepted.
- **Steps to Reproduce:**
  1. Send `POST /users` with payload:
     ```json
     {
       "name": "Bob",
       "email": "not-a-valid-email-string"
     }
     ```
- **Expected Result:**  
  HTTP `400 Bad Request` with message `"email must be an email"`.
- **Actual Result:**  
  HTTP `201 Created`. Invalid string stored in database.
- **Suggested Fix:**  
  Add `@IsEmail({}, { message: 'Email must be a valid email address' })` to `CreateUserDto`.

---

### BUG-05: Products can be created with negative price
- **ID:** BUG-05
- **Module:** Products
- **Severity:** Medium (Business Rule Validation)
- **Priority:** P2 - High
- **Endpoint:** `POST /products`
- **Component File:** `src/products/dto/create-product.dto.ts` (Line 8-9)
- **Description:**  
  `CreateProductDto` does not specify lower bound validation for `price`.
- **Steps to Reproduce:**
  1. Send `POST /products` with:
     ```json
     {
       "name": "Defective Widget",
       "price": -50.00,
       "quantity": 10
     }
     ```
- **Expected Result:**  
  HTTP `400 Bad Request` validation error.
- **Actual Result:**  
  HTTP `201 Created` with negative price.
- **Suggested Fix:**  
  Add `@Min(0.01, { message: 'Price must be greater than zero' })` or `@IsPositive()` to `CreateProductDto`.

---

### BUG-06: Non-numeric route parameters trigger unhandled TypeORM error returning 500
- **ID:** BUG-06
- **Module:** Users, Products, Transactions
- **Severity:** Medium (Error Handling)
- **Priority:** P3 - Medium
- **Endpoint:** `GET /users/:id`, `GET /products/:id`, `GET /transactions/:id`, `PUT /users/:id`, `PUT /products/:id`
- **Component File:** All Controllers
- **Description:**  
  Controllers cast route parameters using `Number(id)`. When an alphanumeric string is sent (e.g. `/users/abc`), `Number('abc')` produces `NaN`. Passing `NaN` to TypeORM results in an unhandled Postgres query syntax error (`invalid input syntax for type integer: "NaN"`), causing an HTTP 500 instead of HTTP 400.
- **Steps to Reproduce:**
  1. Send `GET /users/abc`.
- **Expected Result:**  
  HTTP `400 Bad Request` (`Validation failed (numeric string is expected)`).
- **Actual Result:**  
  HTTP `500 Internal Server Error`.
- **Suggested Fix:**  
  Use NestJS built-in `ParseIntPipe`:
  ```typescript
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number)
  ```

---

### BUG-07: Allows purchasing products marked as `OUT_OF_STOCK`
- **ID:** BUG-07
- **Module:** Transactions
- **Severity:** Medium
- **Priority:** P3 - Medium
- **Endpoint:** `POST /transactions`
- **Component File:** `src/transactions/transactions.service.ts`
- **Description:**  
  When checking product availability, `TransactionsService` checks if `dto.quantity > product.quantity`, but ignores `product.status`. If a product is manually updated to status `OUT_OF_STOCK`, orders can still be placed against it if quantity > 0.
- **Expected Result:**  
  HTTP `400 Bad Request` or `409 Conflict` indicating product is not available for purchase.
- **Actual Result:**  
  Transaction succeeds and is saved.
- **Suggested Fix:**  
  Verify `product.status === ProductStatus.FOR_SALE` before processing order.

