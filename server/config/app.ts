import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFound } from "../middleware/errorHandler";
import { routes } from "../routes";
import { createController } from "express-extract-routes";
import { setupSwagger } from "./swagger";
import { Server as SocketIOServer } from "socket.io";

export const createApp = (io?: SocketIOServer): express.Application => {
  const app = express();

  // Make the "io" accessible globally
  if (io) {
    app.set("io", io);
  }
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://ojt-ms-app.web.app/",
    "https://ojt-ms-app.web.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow any origin for development to support network access
        return callback(null, true);
      },
      credentials: true, // <-- Important
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Middleware
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  //Routes
  routes.forEach((route) => {
    app[route.method](`/api${route.path}`, createController(route));
  });

  // Swagger setup
  setupSwagger(app);

  // Error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
