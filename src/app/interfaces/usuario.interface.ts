// usuario.interface.ts
export interface Usuario {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  password?: string; // Solo para creación/actualización
}

export interface AuthResponse {
  token: string;
  user: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}