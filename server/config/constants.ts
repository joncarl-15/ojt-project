// Purpose: To store all the constants used in the application.
export const config = {
  PORT: 5000,

  MESSAGE: {
    WELCOME: "You're successfully connected to OJT MONITORING SYSTEM API.",
  },

  DB: {
    // Create you own mongodb URI from Atlas MongoDB and use it here.
    URI: "mongodb+srv://ojtmonitoring:ojt1506@cluster0.txegvlu.mongodb.net/ojt-monitoring-system?retryWrites=true&w=majority&appName=Cluster0",
    ERROR: "Error connecting to database: ",
    NOT_INITIALIZED: "Database connection not initialized",
    CONNECTED: "Connected to database",
  },

  CLOUDINARY: {
    CLOUD_NAME: "ojt-dev",
    API_KEY: "955948597478288",
    API_SECRET: "_c1SsqbbATpbO-hSRfB4eIeUXUo",
  },

  JWT: {
    SECRET: (process.env.JWT_SECRET as string) || "ojt-secret-key",
    EXPIRES_IN: (process.env.JWT_EXPIRES_IN as string) || "7d",
    REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN as string) || "30d",
  },
};
