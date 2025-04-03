export interface Video {
  id: number;
  title: string;
  description?: string;
  url: string;
  user_id: number;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  url: string;
  user_id: number;
}