# User Dashboard API Documentation

## Overview

The User Dashboard API provides role-based dashboard data using MongoDB aggregation with `$facet` to efficiently gather statistics for different user types.

## Endpoint

```
GET /api/user/dashboard
```

### Authentication Required

- Bearer Token in Authorization header
- User role is extracted from the authenticated token

## Response Structure

### Student Dashboard

For users with role "student":

```json
{
  "message": "Dashboard data retrieved successfully",
  "dashboard": {
    "totalAnnouncements": 15,
    "totalTasks": 8,
    "userRole": "student"
  }
}
```

### Coordinator Dashboard

For users with role "coordinator":

```json
{
  "message": "Dashboard data retrieved successfully",
  "dashboard": {
    "totalAnnouncements": 15,
    "totalStudentsHandled": 25,
    "bsitStudents": 15,
    "bsbaStudents": 10,
    "companiesWithStudents": 8,
    "userRole": "coordinator"
  }
}
```

### Admin Dashboard

For users with role "admin":

```json
{
  "message": "Dashboard data retrieved successfully",
  "dashboard": {
    "totalStudents": 150,
    "bsitStudents": 85,
    "bsbaStudents": 65,
    "totalCoordinators": 12,
    "totalCompanies": 45,
    "userRole": "admin"
  }
}
```

## Technical Implementation

### MongoDB Aggregation Pipeline

The implementation uses `$facet` to create separate aggregation pipelines for each user role:

1. **Student Dashboard**:

   - Counts total announcements
   - Counts tasks assigned to the student

2. **Coordinator Dashboard**:

   - Counts total announcements
   - Counts students handled by the coordinator
   - Breaks down students by program (BSIT/BSBA)
   - Counts unique companies where students are deployed

3. **Admin Dashboard**:
   - Counts all students by program
   - Counts all coordinators
   - Counts all companies

### Key Features

- **Single Query**: Uses MongoDB `$facet` to execute role-specific logic in one aggregation
- **Efficient**: Leverages MongoDB's aggregation framework for optimal performance
- **Role-based**: Returns different data based on the authenticated user's role
- **Type-safe**: Full TypeScript implementation with proper interfaces

### Error Handling

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Dashboard data not found (user doesn't exist)
- **500 Internal Server Error**: Database or aggregation errors

## Example cURL Request

```bash
curl -X GET "http://localhost:5000/api/user/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Database Collections Used

- `users` - User data and metadata
- `announcements` - System announcements
- `tasks` - Student tasks
- `companies` - Company information

## Implementation Files

- **Repository**: `repositories/userRepository.ts` - Contains the aggregation pipeline
- **Service**: `services/userService.ts` - Business logic and error handling
- **Controller**: `controllers/userController.ts` - HTTP endpoint handler

## Performance Considerations

- The aggregation uses indexed fields for optimal performance
- `$lookup` operations are minimized where possible
- Uses `$facet` to avoid multiple database queries
- Leverages MongoDB's native aggregation for counting operations
