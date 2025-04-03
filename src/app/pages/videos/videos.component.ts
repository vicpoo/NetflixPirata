import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent {
  videos: Video[] = [];
  currentUser: any;
  showUploadModal = false;
  showVideoModal = false;
  currentVideo: Video | null = null;
  safeVideoUrl: SafeResourceUrl | null = null;
  
  newVideo = {
    title: '',
    description: '',
    url: ''
  };

  constructor(
    private usuarioService: UsuarioService,
    private videoService: VideoService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadVideos();
    this.currentUser = this.usuarioService.currentUserValue?.user;
  }

  loadVideos() {
    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
      },
      error: (error) => {
        console.error('Error al cargar videos:', error);
      }
    });
  }

  // Método para reproducir video en modal
  playVideo(video: Video) {
    this.currentVideo = video;
    this.safeVideoUrl = this.getSafeVideoUrl(video.url);
    this.showVideoModal = true;
  }

  // Método para cerrar el modal de video
  closeVideoModal() {
    this.showVideoModal = false;
    this.currentVideo = null;
    this.safeVideoUrl = null;
  }

  // Método para sanitizar la URL del video
  getSafeVideoUrl(url: string): SafeResourceUrl {
    // Convertir URL de YouTube a embed si es necesario
    let videoUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  // Método para obtener thumbnail
  getThumbnailUrl(url: string): string {
    return this.videoService.getThumbnailUrl(url);
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.newVideo = { title: '', description: '', url: '' };
  }

  uploadVideo() {
    const videoData = {
      ...this.newVideo,
      user_id: this.currentUser.id
    };

    this.videoService.uploadVideo(videoData).subscribe({
      next: () => {
        this.closeUploadModal();
        this.loadVideos();
      },
      error: (error) => {
        console.error('Error al subir video:', error);
      }
    });
  }

  logout() {
    this.usuarioService.logout();
  }
}