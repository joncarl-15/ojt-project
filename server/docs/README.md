# OJT Monitoring System API Documentation

Welcome to the OJT (On-the-Job Training) Monitoring System API documentation. This API provides comprehensive functionality for managing students, companies, and their assignments in an OJT program.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Documentation Structure](#documentation-structure)
4. [Core Modules](#core-modules)
5. [API Endpoints](#api-endpoints)
6. [Data Models](#data-models)

## Overview

The OJT Monitoring System API is designed to facilitate the management of On-the-Job Training programs. It allows administrators and coordinators to:

- Manage student profiles and accounts
- Register and manage partner companies
- Assign students to companies for their OJT
- Track deployment status and progress
- Monitor task completion and documentation

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- TypeScript

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Documentation Structure

- `company-management.md` - Company registration and management
- `user-management.md` - User creation and management
- `student-assignment.md` - Student-to-company assignment system
- `real-time-messaging.md` - Real-time messaging system with Socket.IO
- `api-reference.md` - Complete API endpoint reference
- `data-models.md` - Database schema and models
- `authentication.md` - Authentication and authorization
- `examples/` - Request/response examples

## Core Modules

### User Management

- User registration and authentication
- Role-based access control (Admin, Coordinator, Student)
- Profile management and avatar uploads

### Company Management

- Company registration and verification
- Contact information management
- Company search and filtering

### Assignment System

- Student-to-company assignments
- Deployment date tracking
- Status management (scheduled, deployed, completed)

### Real-Time Messaging

- Instant messaging between users
- Read receipts and message tracking
- Socket.IO-powered real-time communication
- Message search and management

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Main Endpoints

- `/user` - User management operations
- `/company` - Company management operations
- `/auth` - Authentication endpoints
- `/message` - Real-time messaging operations
- `/tasks` - Task management (if applicable)
- `/documents` - Document management (if applicable)

## Data Models

### User Model

- Student profiles with metadata for company assignments
- Role-based permissions
- Program enrollment tracking

### Company Model

- Partner company information
- Contact details and requirements
- Capacity and availability tracking

### Assignment Metadata

- Deployment tracking
- Status progression
- Timeline management

## Getting Help

For detailed information about specific features, refer to the individual documentation files in this directory. Each file contains comprehensive guides, examples, and troubleshooting information.

## Contributing

When adding new features or modifying existing functionality, please update the relevant documentation files to maintain accuracy and completeness.
