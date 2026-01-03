import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middleware/authMiddleware";

// Purpose: This file provides helper functions to apply authentication middleware to routes
export const withAuth = (router: Router): Router => {
  router.use(authenticate);
  return router;
};

export const withOptionalAuth = (router: Router): Router => {
  router.use(optionalAuthenticate);
  return router;
};

// Individual route middleware applications
export {
  authenticate as requireAuth,
  optionalAuthenticate as optionalAuth,
} from "../middleware/authMiddleware";
