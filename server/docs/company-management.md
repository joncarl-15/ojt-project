# Company Management Documentation

## Overview

The Company Management module handles all operations related to partner companies in the OJT system. Companies serve as deployment sites for students pursuing their On-the-Job Training requirements.

## Table of Contents

1. [Company Model](#company-model)
2. [API Endpoints](#api-endpoints)
3. [Service Layer](#service-layer)
4. [Repository Layer](#repository-layer)
5. [Usage Examples](#usage-examples)
6. [Error Handling](#error-handling)

## Company Model

### Schema Definition

```typescript
interface CompanyModel extends Document {
  name: string; // Company name (required)
  address: string; // Physical address (required)
  description?: string; // Optional company description
  contactPerson: string; // Primary contact person (required, unique)
  contactEmail: string; // Contact email (required)
  contactPhone?: string; // Optional phone number
}
```

### Field Descriptions

- **name**: The official name of the partner company
- **address**: Physical location where students will be deployed
- **description**: Optional field for additional company information
- **contactPerson**: Primary point of contact (must be unique across all companies)
- **contactEmail**: Email address for company communications
- **contactPhone**: Optional phone number for direct contact

### Database Constraints

- `name` and `address` are required fields
- `contactPerson` must be unique across all companies
- `contactEmail` is required for communication purposes
- Timestamps are automatically managed (createdAt, updatedAt)

## API Endpoints

### Base Route: `/company`

#### 1. Create Company

- **Endpoint**: `POST /company`
- **Authentication**: Required
- **Description**: Register a new partner company

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

**Response:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
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

#### 2. Get Company by ID

- **Endpoint**: `GET /company/:id`
- **Authentication**: Not required
- **Description**: Retrieve company details by ID

**Response:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
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

#### 3. Get All Companies

- **Endpoint**: `GET /company`
- **Authentication**: Required
- **Description**: Retrieve list of all registered companies

**Response:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Tech Solutions Inc.",
    "address": "123 Business District, Metro Manila",
    "contactPerson": "John Smith",
    "contactEmail": "john.smith@techsolutions.com"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Digital Innovations Corp.",
    "address": "456 Tech Hub, Makati City",
    "contactPerson": "Jane Doe",
    "contactEmail": "jane.doe@digitalinnovations.com"
  }
]
```

#### 4. Update Company

- **Endpoint**: `PATCH /company`
- **Authentication**: Required
- **Description**: Update company information

**Request Body:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Tech Solutions Inc. (Updated)",
  "contactPhone": "+63987654321"
}
```

#### 5. Delete Company

- **Endpoint**: `DELETE /company/:id`
- **Authentication**: Required
- **Description**: Remove a company from the system

**Response:**

```
"Company deleted successfully"
```

#### 6. Search Companies

- **Endpoint**: `POST /company/search`
- **Authentication**: Required
- **Description**: Search companies using flexible criteria

**Request Body:**

```json
{
  "name": "Tech",
  "address": "Manila"
}
```

## Service Layer

### CompanyService Methods

#### `createCompany(data: Partial<CompanyModel>)`

- Validates required company data
- Creates new company record
- Returns created company object

#### `getCompany(id: string)`

- Retrieves company by ID
- Throws 404 error if not found
- Returns company object

#### `getCompanies()`

- Retrieves all companies
- Returns array of company objects

#### `updateCompany(updateData: Partial<CompanyModel>)`

- Validates company ID
- Checks if company exists
- Updates company information
- Returns updated company object

#### `deleteCompany(id: string)`

- Deletes company by ID
- Throws 404 error if not found
- Returns deleted company object

#### `searchCompany(query: FilterQuery<CompanyModel>)`

- Performs case-insensitive search
- Supports partial matches on string fields
- Returns first matching company

### Business Logic

The service layer implements the following business rules:

1. **Data Validation**: Ensures all required fields are present
2. **Existence Checks**: Verifies companies exist before updates/deletes
3. **Case-Insensitive Search**: Enables flexible company lookup
4. **Error Handling**: Provides meaningful error messages

## Repository Layer

### CompanyRepository Methods

The repository layer provides direct database access methods:

- `getCompany(id: string)`: Find company by ID
- `getCompanies()`: Retrieve all companies
- `createCompany(data)`: Create new company
- `updateCompany(id, data)`: Update existing company
- `deleteCompany(id)`: Remove company
- `searchCompany(query)`: Search with MongoDB query
- `searchAndUpdate(query, update?, options?)`: Flexible search/update operation

## Usage Examples

### Creating a New Company

```typescript
const companyData = {
  name: "Innovative Tech Corp",
  address: "789 Innovation Drive, BGC",
  description: "Cutting-edge technology solutions",
  contactPerson: "Alice Johnson",
  contactEmail: "alice@innovativetech.com",
  contactPhone: "+63919876543",
};

const company = await companyService.createCompany(companyData);
```

### Searching for Companies

```typescript
// Search by name (case-insensitive)
const searchQuery = { name: "tech" };
const company = await companyService.searchCompany(searchQuery);

// Search by location
const locationQuery = { address: "makati" };
const company = await companyService.searchCompany(locationQuery);
```

### Updating Company Information

```typescript
const updateData = {
  _id: "507f1f77bcf86cd799439011",
  contactPhone: "+63998877665",
  description: "Updated company description",
};

const updatedCompany = await companyService.updateCompany(updateData);
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "error": "Company data are required",
  "statusCode": 400
}
```

#### 404 Not Found

```json
{
  "error": "Company not found",
  "statusCode": 404
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "statusCode": 500
}
```

### Error Scenarios

1. **Missing Required Data**: When creating a company without required fields
2. **Company Not Found**: When accessing non-existent companies
3. **Duplicate Contact Person**: When trying to create a company with an existing contact person
4. **Invalid ID Format**: When providing malformed ObjectId

## Best Practices

1. **Always validate input data** before processing
2. **Use consistent error messages** across all endpoints
3. **Implement proper authentication** for sensitive operations
4. **Log company operations** for audit trails
5. **Validate email formats** for contact emails
6. **Sanitize string inputs** to prevent injection attacks

## Integration with Student Assignment

Companies created through this module can be used in the student assignment system. The company ID is stored in the user's metadata when a student is assigned to a company for their OJT deployment.
