import { authenticate } from "./authMiddleware";

// Purpose: Decorator to add authentication middleware to controller methods
export function RequireAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const [req, res, next] = args;

    // Apply authentication middleware
    authenticate(req, res, (error: any) => {
      if (error) {
        return next(error);
      }
      // If authentication passes, call the original method
      return originalMethod.apply(this, args);
    });
  };

  return descriptor;
}
