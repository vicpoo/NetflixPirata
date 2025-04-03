// video.interface.ts
export interface Video {
  id: number;
  title: string;
  description?: string;
  url: string;
  local_path?: string;
  is_cached?: boolean;
  cache_expiry?: string;
  user_id: number;
  file?: File; // Nuevo campo para el archivo
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  url?: string; // Hacerlo opcional para permitir subida de archivos
  user_id: number;
  file?: File; // Nuevo campo para el archivo
}