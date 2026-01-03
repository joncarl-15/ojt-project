import { Application, Request, Response, NextFunction } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OJT MONITORING SYSTEM API",
      version: "1.0.0",
      description:
        "A robust and scalable OJT MONITORING SYSTEM API using Express.js and TypeScript",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./controllers/*.ts", "./routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);
const theme = new SwaggerTheme();

export const setupSwagger = (app: Application) => {
  const allowedOrigin = "http://localhost:5173";

  // ✅ Add explicit CORS middleware for Swagger docs
  app.use("/api/docs", (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: theme.getBuffer(SwaggerThemeNameEnum.CLASSIC),
    })
  );
};
