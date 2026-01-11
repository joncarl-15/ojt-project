import "dotenv/config";
import { createApp } from "./config/app";
import { connectDatabase } from "./config/database";
import { config } from "./config/constants";

import http from "http";
import "reflect-metadata";

// Purpose: Start the server

// Purpose: Start the server
const startServer = async () => {
  try {
    await connectDatabase();

    // Create app first
    const app = createApp();

    // Create HTTP server passing the app
    const server = http.createServer(app);

    const port = process.env.PORT || config.PORT;


    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

// Export app for Vercel
export default createApp();

// Only listen if run directly (not imported as a module)
if (require.main === module) {
  startServer();
}
