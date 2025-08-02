export interface User {
  userId: string;
  username: string;
  email: string;
  phone?: string;
  profileImage?: string;
  licenseNumber?: string;
  roles: string[];
  companies: Company[];
  clinics: Clinic[];
}

export interface Company {
  id: string;
  name: string;
}

export interface Clinic {
  id: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  message?: string;
  error?: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  officialEmail: string;
  personalEmail?: string;
  phone1?: string;
  phone2?: string;
  profileImage?: string;
  licenseNumber?: string;
  licenseImage?: string;
  createdAt: string;
  roles: string[];
  companies: Company[];
  clinics: Clinic[];
}