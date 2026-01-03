import { TokenPayload } from "../helpers/interface";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
