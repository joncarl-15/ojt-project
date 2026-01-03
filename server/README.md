# OJT Monitoring System API

A robust and scalable OJT (On-the-Job Training) monitoring system API built with MongoDB, Express.js, and TypeScript, designed for tracking and managing internship programs.

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- TypeScript (v4.5 or higher)
- npm or yarn

## 🚀 Quick Start

1. Clone the repository:

```bash
git clone https://github.com/ojtmonitoringsystemph/ojt-monitoring-system-api.git
cd ojt-monitoring-system-api
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ojt-monitoring-system
NODE_ENV=development
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Start the development server:

```bash
npm run dev
```

## 🛠️ Scripts

- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run tests

## 📁 Project Structure

```
├── config/        # Configuration files
├── helpers/       # Helpers files
├── controllers/   # Route controllers
├── middlewares/   # Custom middlewares
├── models/        # MongoDB models
├── repositories/  # Database operations
├── routes/        # API routes
├── services/      # Business logic
└── index.ts       # Express app initialization
```

## 🔒 Environment Variables

| Variable              | Description            | Default     |
| --------------------- | ---------------------- | ----------- |
| PORT                  | Server port            | 5000        |
| MONGODB_URI           | MongoDB connection URL | -           |
| NODE_ENV              | Environment            | development |
| JWT_SECRET            | JWT signing secret     | -           |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name  | -           |
| CLOUDINARY_API_KEY    | Cloudinary API key     | -           |
| CLOUDINARY_API_SECRET | Cloudinary API secret  | -           |

## 🔗 API Endpoints

This is a boilerplate API structure. Endpoints will be documented as features are implemented.

<!-- Future endpoints for OJT monitoring system:
- User management (students, supervisors, coordinators)
- OJT program management
- Progress tracking and reporting
- Document uploads and management
- Evaluation and assessment
-->

## 💻 Technology Stack

- Express.js - Web application framework
- TypeScript - Type-safe JavaScript
- MongoDB & Mongoose - Database and ODM
- Cloudinary - Image and file storage
- Winston - Logging system
- Helmet - Security middleware
- Multer - File upload handling
- ESLint & Prettier - Code quality

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js documentation
- MongoDB documentation
- TypeScript documentation
