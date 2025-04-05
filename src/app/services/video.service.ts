//video.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video, CreateVideoRequest } from '../interfaces/video.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  readonly apiUrl = 'http://44.210.114.208:8000/';

  constructor(private http: HttpClient) { }

  getAllVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos/`);
  }

  getVideoById(id: number): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`);
  }

  // Para subir archivos de video
  uploadVideoFile(formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${this.apiUrl}/videos/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }

  // Para agregar videos de YouTube
  addYouTubeVideo(videoData: CreateVideoRequest): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/videos/`, videoData);
  }

  cacheVideo(id: number): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/videos/${id}/cache`, {});
  }

  clearCache(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/videos/${id}/cache`);
  }

  getVideoStreamUrl(id: number): string {
    return `${this.apiUrl}/videos/${id}/cache`;
  }

  isYoutubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getThumbnailUrl(url: string): string {
    if (this.isYoutubeUrl(url)) {
      const videoId = this.extractYoutubeId(url);
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return 'assets/default-video-thumbnail.jpg';
  }

  private extractYoutubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }
}