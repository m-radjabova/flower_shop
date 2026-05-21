export type UserRole = "admin" | "owner" | "customer";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
