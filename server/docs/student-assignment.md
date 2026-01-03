# Student Assignment Documentation

## Overview

The Student Assignment module manages the assignment of students to partner companies for their On-the-Job Training (OJT) requirements. This system tracks deployment dates, monitors status progression, and maintains the relationship between students and their assigned companies.

## Table of Contents

1. [Assignment System Architecture](#assignment-system-architecture)
2. [User Metadata Structure](#user-metadata-structure)
3. [Assignment Status Flow](#assignment-status-flow)
4. [API Endpoints](#api-endpoints)
5. [Service Methods](#service-methods)
6. [Usage Examples](#usage-examples)
7. [Business Rules](#business-rules)
8. [Error Handling](#error-handling)

## Assignment System Architecture

The assignment system is built on the User model's metadata field, which contains company assignment information:

```typescript
metadata?: {
  company?: Schema.Types.ObjectId;     // Reference to Company document
  deploymentDate?: Date;               // When the student starts OJT
  status?: "scheduled" | "deployed" | "completed";  // Current status
}
```

### Key Components

1. **User Model**: Contains student information and assignment metadata
2. **Company Model**: Partner companies available for assignments
3. **Assignment Service**: Business logic for managing assignments
4. **Status Tracking**: Progress monitoring through deployment lifecycle

## User Metadata Structure

### Field Descriptions

- **company**: MongoDB ObjectId reference to the assigned company
- **deploymentDate**: Date when the student begins their OJT
- **status**: Current stage of the deployment process

### Status Definitions

| Status      | Description                                          |
| ----------- | ---------------------------------------------------- |
| `scheduled` | Student has been assigned but hasn't started OJT yet |
| `deployed`  | Student is currently active in their OJT placement   |
| `completed` | Student has finished their OJT requirements          |

## Assignment Status Flow

```
[Unassigned] → [Scheduled] → [Deployed] → [Completed]
     ↑              ↓              ↓           ↓
     └──────────[Unassigned]←──────────────────┘
```

### Status Transitions

1. **Unassigned → Scheduled**: Initial assignment to a company
2. **Scheduled → Deployed**: Student begins OJT at the assigned company
3. **Deployed → Completed**: Student finishes OJT requirements
4. **Any Status → Unassigned**: Student is unassigned from company

## API Endpoints

### Base Route: `/user`

#### 1. Assign Student to Company

- **Endpoint**: `POST /user/assign-company`
- **Authentication**: Required
- **Description**: Assign a student to a partner company

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "companyId": "507f1f77bcf86cd799439012",
  "deploymentDate": "2025-11-01T00:00:00.000Z",
  "status": "scheduled"
}
```

**Response:**

```json
{
  "message": "User successfully assigned to company",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.edu",
    "role": "student",
    "metadata": {
      "company": "507f1f77bcf86cd799439012",
      "deploymentDate": "2025-11-01T00:00:00.000Z",
      "status": "scheduled"
    },
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-05T00:00:00.000Z"
  }
}
```

#### 2. Unassign Student from Company

- **Endpoint**: `POST /user/unassign-company`
- **Authentication**: Required
- **Description**: Remove student's company assignment

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "message": "User successfully unassigned from company",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.edu",
    "role": "student",
    "metadata": {
      "company": null,
      "deploymentDate": null,
      "status": "scheduled"
    },
    "updatedAt": "2025-10-05T00:00:00.000Z"
  }
}
```

#### 3. Update Deployment Status

- **Endpoint**: `PATCH /user/deployment-status`
- **Authentication**: Required
- **Description**: Update student's deployment status

**Request Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "status": "deployed"
}
```

**Response:**

```json
{
  "message": "User deployment status updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.edu",
    "role": "student",
    "metadata": {
      "company": "507f1f77bcf86cd799439012",
      "deploymentDate": "2025-11-01T00:00:00.000Z",
      "status": "deployed"
    },
    "updatedAt": "2025-10-05T00:00:00.000Z"
  }
}
```

## Service Methods

### UserService Assignment Methods

#### `assignUserToCompany(userId, companyId, deploymentDate?, status?)`

**Purpose**: Assign a student to a company for OJT

**Parameters**:

- `userId` (string): Student's user ID
- `companyId` (string): Target company ID
- `deploymentDate` (Date, optional): Start date (defaults to current date)
- `status` (string, optional): Initial status (defaults to "scheduled")

**Validations**:

1. User exists in the system
2. User role is "student"
3. Student is not already assigned to a company

**Business Logic**:

```typescript
// Preserve existing metadata while adding assignment info
const updateData = {
  metadata: {
    ...user.metadata,
    company: companyId,
    deploymentDate: deploymentDate || new Date(),
    status: status || "scheduled",
  },
};
```

#### `unassignUserFromCompany(userId)`

**Purpose**: Remove student's company assignment

**Parameters**:

- `userId` (string): Student's user ID

**Validations**:

1. User exists in the system
2. User role is "student"
3. Student is currently assigned to a company

**Business Logic**:

```typescript
// Clear assignment data while preserving other metadata
const updateData = {
  metadata: {
    ...user.metadata,
    company: undefined,
    deploymentDate: undefined,
    status: "scheduled",
  },
};
```

#### `updateUserDeploymentStatus(userId, status)`

**Purpose**: Update student's deployment status

**Parameters**:

- `userId` (string): Student's user ID
- `status` (string): New status ("scheduled", "deployed", "completed")

**Validations**:

1. User exists in the system
2. User role is "student"
3. Student is assigned to a company
4. Status value is valid

## Usage Examples

### Complete Assignment Workflow

#### Step 1: Assign Student to Company

```typescript
const assignmentData = {
  userId: "student123",
  companyId: "company456",
  deploymentDate: new Date("2025-11-15"),
  status: "scheduled",
};

const result = await userService.assignUserToCompany(
  assignmentData.userId,
  assignmentData.companyId,
  assignmentData.deploymentDate,
  assignmentData.status
);
```

#### Step 2: Update Status When Student Starts OJT

```typescript
await userService.updateUserDeploymentStatus("student123", "deployed");
```

#### Step 3: Mark as Completed When OJT Ends

```typescript
await userService.updateUserDeploymentStatus("student123", "completed");
```

#### Step 4: Unassign if Needed

```typescript
await userService.unassignUserFromCompany("student123");
```

### Querying Assigned Students

```typescript
// Get all students assigned to a specific company
const assignedStudents = await userRepository.searchAndUpdate(
  { "metadata.company": companyId },
  undefined,
  { multi: true }
);

// Get students by deployment status
const deployedStudents = await userRepository.searchAndUpdate(
  { "metadata.status": "deployed" },
  undefined,
  { multi: true }
);
```

## Business Rules

### Assignment Rules

1. **Student-Only Assignments**: Only users with role "student" can be assigned to companies
2. **Single Assignment**: A student can only be assigned to one company at a time
3. **Valid Company**: The target company must exist in the system
4. **Status Progression**: Status changes should follow logical progression

### Validation Rules

1. **User Existence**: All operations require valid user ID
2. **Role Verification**: Assignment operations are restricted to students
3. **Assignment State**: Status updates require existing assignment
4. **Data Integrity**: Metadata is preserved during updates

### Default Behaviors

1. **Default Deployment Date**: If not provided, defaults to current date
2. **Default Status**: New assignments default to "scheduled"
3. **Status Reset**: Unassigning resets status to "scheduled"
4. **Metadata Preservation**: Other metadata fields are preserved during updates

## Error Handling

### Common Error Scenarios

#### 1. User Not Found (404)

```json
{
  "error": "User not found",
  "statusCode": 404
}
```

#### 2. Invalid User Role (400)

```json
{
  "error": "Only students can be assigned to companies",
  "statusCode": 400
}
```

#### 3. Already Assigned (400)

```json
{
  "error": "User is already assigned to a company",
  "statusCode": 400
}
```

#### 4. Not Assigned (400)

```json
{
  "error": "User is not assigned to any company",
  "statusCode": 400
}
```

#### 5. Invalid Status (400)

```json
{
  "error": "Invalid status. Must be 'scheduled', 'deployed', or 'completed'",
  "statusCode": 400
}
```

#### 6. Missing Required Fields (400)

```json
{
  "error": "User ID and Company ID are required",
  "statusCode": 400
}
```

### Error Handling Best Practices

1. **Validate Input**: Check all required parameters before processing
2. **Verify Permissions**: Ensure user has appropriate role
3. **Check Prerequisites**: Validate assignment state before operations
4. **Provide Clear Messages**: Use descriptive error messages
5. **Log Operations**: Track assignment changes for audit purposes

## Integration Points

### With Company Management

- Company IDs are validated against existing companies
- Company information can be populated when retrieving assigned students

### With Authentication System

- All assignment operations require authentication
- Role-based access control restricts operations to appropriate users

### With Task Management (if applicable)

- Assignment status may trigger task creation
- Deployment status affects task availability

## Monitoring and Reporting

### Key Metrics

1. **Assignment Rates**: Number of students assigned per period
2. **Status Distribution**: Count of students in each status
3. **Company Utilization**: Number of students per company
4. **Completion Rates**: Percentage of students completing OJT

### Useful Queries

```javascript
// Students by status
db.users.aggregate([
  { $match: { role: "student" } },
  { $group: { _id: "$metadata.status", count: { $sum: 1 } } },
]);

// Company assignment summary
db.users.aggregate([
  { $match: { "metadata.company": { $exists: true } } },
  {
    $lookup: {
      from: "companies",
      localField: "metadata.company",
      foreignField: "_id",
      as: "company",
    },
  },
  { $group: { _id: "$company.name", students: { $sum: 1 } } },
]);
```

## Future Enhancements

1. **Batch Assignments**: Assign multiple students to companies at once
2. **Assignment History**: Track assignment changes over time
3. **Capacity Management**: Enforce company student limits
4. **Automated Status Updates**: Status progression based on time or events
5. **Assignment Recommendations**: Suggest optimal company matches for students
