# API Reference

## Overview

Complete API reference for the OJT Monitoring System. This document provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management APIs](#user-management-apis)
3. [Company Management APIs](#company-management-apis)
4. [Student Assignment APIs](#student-assignment-apis)
5. [Response Formats](#response-formats)
6. [Error Codes](#error-codes)

## Authentication

### Base URL

```
http://localhost:3000/api
```

### Authentication Header

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Status

- 🔓 **Public**: No authentication required
- 🔒 **Private**: Authentication required
- 👑 **Admin**: Admin/Coordinator role required

## User Management APIs

### Base Route: `/user`

#### Create User

**POST** `/user` 🔓

Create a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Smith",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "role": "student",
  "program": "bsit"
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Smith",
  "email": "john.doe@example.com",
  "role": "student",
  "program": "bsit",
  "avatar": null,
  "metadata": {
    "status": "scheduled"
  },
  "createdAt": "2025-10-05T00:00:00.000Z",
  "updatedAt": "2025-10-05T00:00:00.000Z"
}
```

---

#### Get User by ID

**GET** `/user/:id` 🔓

Retrieve user information by ID.

**Parameters:**

- `id` (string): User ID

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "student",
  "program": "bsit",
  "metadata": {
    "company": "507f1f77bcf86cd799439012",
    "deploymentDate": "2025-11-01T00:00:00.000Z",
    "status": "scheduled"
  }
}
```

---

#### Get All Users

**GET** `/user` 🔒

Retrieve list of all users with optional role filtering.

**Query Parameters:**

- `role` (string, optional): Filter by user role (`admin`, `coordinator`, `student`)

**Example:**

```http
GET /user?role=student
```

**Response:** `200 OK`

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "student"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "role": "student"
  }
]
```

---

#### Update User

**PATCH** `/user` 🔒

Update user information.

**Request Body:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John Updated",
  "program": "bsba"
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John Updated",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "student",
  "program": "bsba",
  "updatedAt": "2025-10-05T12:00:00.000Z"
}
```

---

#### Delete User

**DELETE** `/user/:id` 🔒

Delete a user account.

**Parameters:**

- `id` (string): User ID

**Response:** `200 OK`

```
"User deleted successfully"
```

---

#### Search Users

**POST** `/user/search` 🔒

Search for users using flexible criteria.

**Request Body:**

```json
{
  "email": "john",
  "role": "student"
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "student"
}
```

---

#### Upload User Avatar

**POST** `/user/upload/:id` 🔒

Upload avatar image for a user.

**Parameters:**

- `id` (string): User ID

**Request:** `multipart/form-data`

- `image` (file): Image file

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://cloudinary-url/avatar.jpg",
  "updatedAt": "2025-10-05T12:00:00.000Z"
}
```

## Student Assignment APIs

### Base Route: `/user`

#### Assign Student to Company

**POST** `/user/assign-company` 🔒

Assign a student to a partner company for OJT.

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "companyId": "507f1f77bcf86cd799439012",
  "deploymentDate": "2025-11-01T00:00:00.000Z",
  "status": "scheduled"
}
```

**Response:** `200 OK`

```json
{
  "message": "User successfully assigned to company",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "metadata": {
      "company": "507f1f77bcf86cd799439012",
      "deploymentDate": "2025-11-01T00:00:00.000Z",
      "status": "scheduled"
    }
  }
}
```

---

#### Unassign Student from Company

**POST** `/user/unassign-company` 🔒

Remove student's company assignment.

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`

```json
{
  "message": "User successfully unassigned from company",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "metadata": {
      "company": null,
      "deploymentDate": null,
      "status": "scheduled"
    }
  }
}
```

---

#### Update Deployment Status

**PATCH** `/user/deployment-status` 🔒

Update student's deployment status.

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "status": "deployed"
}
```

**Response:** `200 OK`

```json
{
  "message": "User deployment status updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "metadata": {
      "company": "507f1f77bcf86cd799439012",
      "deploymentDate": "2025-11-01T00:00:00.000Z",
      "status": "deployed"
    }
  }
}
```

## Company Management APIs

### Base Route: `/company`

#### Create Company

**POST** `/company` 🔒

Register a new partner company.

**Request Body:**

```json
{
  "name": "Tech Solutions Inc.",
  "address": "123 Business District, Metro Manila",
  "description": "Leading software development company",
  "contactPerson": "John Smith",
  "contactEmail": "john.smith@techsolutions.com",
  "contactPhone": "+63912345678"
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Tech Solutions Inc.",
  "address": "123 Business District, Metro Manila",
  "description": "Leading software development company",
  "contactPerson": "John Smith",
  "contactEmail": "john.smith@techsolutions.com",
  "contactPhone": "+63912345678",
  "createdAt": "2025-10-05T00:00:00.000Z",
  "updatedAt": "2025-10-05T00:00:00.000Z"
}
```

---

#### Get Company by ID

**GET** `/company/:id` 🔓

Retrieve company information by ID.

**Parameters:**

- `id` (string): Company ID

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Tech Solutions Inc.",
  "address": "123 Business District, Metro Manila",
  "description": "Leading software development company",
  "contactPerson": "John Smith",
  "contactEmail": "john.smith@techsolutions.com",
  "contactPhone": "+63912345678"
}
```

---

#### Get All Companies

**GET** `/company` 🔒

Retrieve list of all registered companies.

**Response:** `200 OK`

```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Tech Solutions Inc.",
    "address": "123 Business District, Metro Manila",
    "contactPerson": "John Smith",
    "contactEmail": "john.smith@techsolutions.com"
  }
]
```

---

#### Update Company

**PATCH** `/company` 🔒

Update company information.

**Request Body:**

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Tech Solutions Inc. (Updated)",
  "contactPhone": "+63987654321"
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Tech Solutions Inc. (Updated)",
  "contactPhone": "+63987654321",
  "updatedAt": "2025-10-05T12:00:00.000Z"
}
```

---

#### Delete Company

**DELETE** `/company/:id` 🔒

Remove a company from the system.

**Parameters:**

- `id` (string): Company ID

**Response:** `200 OK`

```
"Company deleted successfully"
```

---

#### Search Companies

**POST** `/company/search` 🔒

Search companies using flexible criteria.

**Request Body:**

```json
{
  "name": "Tech",
  "address": "Manila"
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Tech Solutions Inc.",
  "address": "123 Business District, Metro Manila",
  "contactPerson": "John Smith"
}
```

## Response Formats

### Success Response Structure

```json
{
  "data": {},
  "message": "Success message",
  "timestamp": "2025-10-05T12:00:00.000Z"
}
```

### Error Response Structure

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2025-10-05T12:00:00.000Z"
}
```

## Error Codes

### HTTP Status Codes

| Code | Meaning               | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 500  | Internal Server Error | Server error                  |

### Common Error Messages

#### Authentication Errors

- `"Authentication required"`
- `"Invalid token"`
- `"Token expired"`

#### Validation Errors

- `"User firstname and lastname data are required"`
- `"Email is required"`
- `"Invalid role. Must be admin, coordinator, or student"`
- `"User ID and Company ID are required"`

#### Business Logic Errors

- `"User not found"`
- `"Company not found"`
- `"User with this email already exists"`
- `"Only students can be assigned to companies"`
- `"User is already assigned to a company"`
- `"User is not assigned to any company"`

#### File Upload Errors

- `"Please upload an image"`
- `"Invalid file format"`
- `"File size too large"`

## Rate Limiting

### Default Limits

- **General API**: 100 requests per minute per IP
- **File Upload**: 10 requests per minute per user
- **Search Operations**: 50 requests per minute per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633072800
```

## API Versioning

Current API version: `v1`

Future versions will be accessible via:

```
http://localhost:3000/api/v2/...
```

## CORS Configuration

The API supports CORS for the following origins:

- `http://localhost:3000` (Development)
- `http://localhost:3001` (Development)
- Production domains (configured via environment variables)

## Request/Response Examples

### Complete Student Assignment Workflow

#### 1. Create a Student

```bash
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@student.edu",
    "password": "secure123",
    "role": "student",
    "program": "bsit"
  }'
```

#### 2. Create a Company

```bash
curl -X POST http://localhost:3000/api/company \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Digital Innovations Corp",
    "address": "456 Tech Hub, Makati City",
    "contactPerson": "Bob Wilson",
    "contactEmail": "bob@digitalinnovations.com"
  }'
```

#### 3. Assign Student to Company

```bash
curl -X POST http://localhost:3000/api/user/assign-company \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "companyId": "507f1f77bcf86cd799439012",
    "deploymentDate": "2025-11-15T00:00:00.000Z",
    "status": "scheduled"
  }'
```

#### 4. Update Status to Deployed

```bash
curl -X PATCH http://localhost:3000/api/user/deployment-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "status": "deployed"
  }'
```

This completes the API reference documentation. All endpoints are thoroughly documented with request/response examples, authentication requirements, and error handling information.
