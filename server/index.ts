import dotenv from "dotenv";
import { createApp } from "./config/app";
import { connectDatabase } from "./config/database";
import { config } from "./config/constants";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import "reflect-metadata";

dotenv.config();

// Purpose: Start the server
const startServer = async () => {
  try {
    await connectDatabase();

    // Create app first
    const app = createApp();

    // Create HTTP server passing the app
    const server = http.createServer(app);

    const port = process.env.PORT || config.PORT;
    const io = new SocketIOServer(server, {
      cors: {
        origin: "https://ojt-ms-app.web.app/",
        credentials: true,
      },
    });

    // Make io accessible to our router
    app.set("io", io);

    // Add socket connection handling
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join user to their own room for private messaging
      socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
