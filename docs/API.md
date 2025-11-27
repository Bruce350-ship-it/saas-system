# SaaS Multi-Tenant System API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API endpoints (except login) require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@system.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "admin@system.com",
    "name": "System Administrator",
    "role": "super_admin",
    "tenantId": null
  }
}
```

#### GET /auth/verify
Verify current token and get user information.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "admin@system.com",
    "name": "System Administrator",
    "role": "super_admin"
  }
}
```

### Super Admin Endpoints

#### GET /tenants
List all tenants (super admin only).

**Response:**
```json
{
  "tenants": [
    {
      "id": "tenant_id",
      "businessName": "Test Business",
      "contactEmail": "test@business.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /tenants
Create a new tenant (super admin only).

**Request Body:**
```json
{
  "businessName": "New Business",
  "contactEmail": "contact@newbusiness.com",
  "adminName": "Admin Name",
  "adminEmail": "admin@newbusiness.com",
  "adminPassword": "password123"
}
```

**Response:**
```json
{
  "tenant": {
    "id": "new_tenant_id",
    "businessName": "New Business",
    "contactEmail": "contact@newbusiness.com",
    "dbUrl": "postgresql://username:password@localhost:5432/tenant_new_business",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "instructions": {
    "message": "Tenant created successfully. Manual database setup required:",
    "steps": [
      "1. Create PostgreSQL database: tenant_new_business",
      "2. Run tenant schema migration on the new database",
      "3. Create admin user in tenant database",
      "4. Update dbUrl in master database if needed"
    ]
  }
}
```

### Tenant Admin Endpoints

#### Users Management

##### GET /users
List all users in the tenant.

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

##### POST /users
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "USER"
}
```

**Response:**
```json
{
  "user": {
    "id": "new_user_id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

##### PUT /users
Update an existing user.

**Request Body:**
```json
{
  "id": "user_id",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "ADMIN"
}
```

##### DELETE /users?id=user_id
Delete a user.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

#### Products Management

##### GET /products
List all products.

**Response:**
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 29.99,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

##### POST /products
Create a new product.

**Request Body:**
```json
{
  "name": "New Product",
  "price": 19.99
}
```

**Response:**
```json
{
  "product": {
    "id": "new_product_id",
    "name": "New Product",
    "price": 19.99,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

##### PUT /products
Update an existing product.

**Request Body:**
```json
{
  "id": "product_id",
  "name": "Updated Product",
  "price": 39.99
}
```

##### DELETE /products?id=product_id
Delete a product.

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

#### Sales Management

##### GET /sales
List all sales with optional filters.

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO string)
- `endDate` (optional): End date filter (ISO string)
- `productId` (optional): Filter by product ID
- `userId` (optional): Filter by user ID

**Response:**
```json
{
  "sales": [
    {
      "id": "sale_id",
      "productId": "product_id",
      "userId": "user_id",
      "quantity": 2,
      "total": 59.98,
      "synced": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "product": {
        "id": "product_id",
        "name": "Product Name",
        "price": 29.99
      },
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

##### POST /sales
Create a new sale.

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

**Response:**
```json
{
  "sale": {
    "id": "new_sale_id",
    "productId": "product_id",
    "userId": "user_id",
    "quantity": 2,
    "total": 59.98,
    "synced": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "product": {
      "id": "product_id",
      "name": "Product Name",
      "price": 29.99
    },
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Mobile Sync Endpoint

#### POST /sync
Sync offline sales data from mobile clients.

**Request Body:**
```json
{
  "sales": [
    {
      "productId": "product_id",
      "quantity": 1,
      "total": 29.99,
      "localId": "local_sale_id"
    }
  ]
}
```

**Response:**
```json
{
  "syncedSales": [
    {
      "localId": "local_sale_id",
      "serverId": "server_sale_id",
      "sale": {
        "id": "server_sale_id",
        "productId": "product_id",
        "userId": "user_id",
        "quantity": 1,
        "total": 29.99,
        "synced": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "errors": [],
  "products": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 29.99,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "syncStatus": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "syncedCount": 1,
    "errorCount": 0
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error


