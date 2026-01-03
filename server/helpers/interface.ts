import { UserModel } from "@/models/userModel";

export interface LoginCredentials {
  userName: string;
  password: string;
  role: "admin" | "coordinator" | "student";
}

export interface RegisterData {
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  program: "bsit" | "bsba";
  role: "admin" | "coordinator" | "student";
  email: string;
  password: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  firstName: string;
  role?: "admin" | "coordinator" | "student";
  program?: "bsit" | "bsba";
}

export interface AuthResponse {
  user: Omit<UserModel, "password">;
  accessToken: string;
  refreshToken: string;
}
