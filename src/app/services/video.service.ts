import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video, CreateVideoRequest } from '../interfaces/video.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getAllVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos/`);
  }

  getVideoById(id: number): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`);
  }

  uploadVideo(videoData: CreateVideoRequest): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/videos/`, videoData);
  }

  // Método para obtener thumbnail de YouTube (ejemplo)
  getThumbnailUrl(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYoutubeId(url);
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return 'assets/default-video-thumbnail.jpg';
  }

  private extractYoutubeId(url: string): string {
    // Lógica para extraer ID de YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }
}