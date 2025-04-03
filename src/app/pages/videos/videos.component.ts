import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { VideoService } from '../../services/video.service';
import { Video, CreateVideoRequest } from '../../interfaces/video.interface';
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
  showYoutubeModal = false;
  showVideoModal = false;
  currentVideo: Video | null = null;
  safeVideoUrl: SafeResourceUrl | null = null;
  offlineMode = false;
  
  uploadForm = {
    title: '',
    description: '',
    file: null as File | null
  };
  
  youtubeForm = {
    title: '',
    description: '',
    url: ''
  };

  uploadProgress: number | null = null;
  uploadInProgress = false;
  supportedFormats = ['video/mp4', 'video/webm', 'video/quicktime'];

  constructor(
    private usuarioService: UsuarioService,
    public videoService: VideoService,
    private sanitizer: DomSanitizer
  ) {
    this.checkOnlineStatus();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  ngOnInit() {
    this.loadVideos();
    this.currentUser = this.usuarioService.currentUserValue?.user;
  }

  checkOnlineStatus() {
    this.offlineMode = !navigator.onLine;
  }

  updateOnlineStatus() {
    this.offlineMode = !navigator.onLine;
    if (!this.offlineMode) {
      this.loadVideos();
    }
  }

  loadVideos() {
    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
      },
      error: (error) => {
        console.error('Error al cargar videos:', error);
        if (this.offlineMode) {
          this.videos = this.videos.filter(v => v.is_cached && this.isCacheValid(v));
        }
      }
    });
  }

  playVideo(video: Video) {
    this.currentVideo = video;
    
    if (this.videoService.isYoutubeUrl(video.url)) {
      if (this.offlineMode) {
        alert('Los videos de YouTube requieren conexión a internet');
        return;
      }
      this.safeVideoUrl = this.getSafeYoutubeUrl(video.url);
    } else {
      let videoUrl = video.url;
      
      // Si es una ruta relativa, construir la URL completa
      if (!videoUrl.startsWith('http')) {
        videoUrl = `${this.videoService.apiUrl}${videoUrl}`;
      }
      
      // Si está cacheados, usar la ruta de caché
      if (video.is_cached && this.isCacheValid(video)) {
        videoUrl = this.videoService.getVideoStreamUrl(video.id);
      } else if (this.offlineMode) {
        alert('Este video no está disponible offline. Conéctate a internet o guárdalo para offline.');
        return;
      }
      
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }
    
    this.showVideoModal = true;
  }

  isCacheValid(video: Video): boolean {
    if (!video.cache_expiry) return true;
    const expiryDate = new Date(video.cache_expiry);
    return expiryDate > new Date();
  }

  isYoutubeUrl(url: string): boolean {
    return this.videoService.isYoutubeUrl(url);
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    let videoUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.supportedFormats.includes(file.type)) {
      this.uploadForm.file = file;
      if (!this.uploadForm.title) {
        this.uploadForm.title = file.name.replace(/\.[^/.]+$/, "");
      }
    } else {
      alert(`Formato no soportado. Usa: ${this.supportedFormats.join(', ')}`);
      this.resetUploadForm();
    }
  }

  uploadVideo() {
    if (this.uploadInProgress || !this.uploadForm.file) return;
    
    this.uploadInProgress = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('title', this.uploadForm.title);
    formData.append('description', this.uploadForm.description || '');
    formData.append('user_id', this.currentUser.id.toString());
    formData.append('file', this.uploadForm.file, this.uploadForm.file.name);

    this.videoService.uploadVideoFile(formData).subscribe({
      next: (event: any) => {
        if (event.type === 1 && event.loaded && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.body) {
          this.handleUploadSuccess(event.body);
        }
      },
      error: (error) => this.handleUploadError(error),
      complete: () => this.resetUploadState()
    });
  }

  private handleUploadSuccess(newVideo: Video) {
    this.videos.unshift(newVideo);
    this.closeUploadModal();
    
    if (!this.isYoutubeUrl(newVideo.url)) {
      this.videoService.cacheVideo(newVideo.id).subscribe({
        next: (cachedVideo) => {
          const index = this.videos.findIndex(v => v.id === newVideo.id);
          if (index !== -1) this.videos[index] = cachedVideo;
        },
        error: (error) => console.error('Cacheo automático fallido:', error)
      });
    }
  }

  private handleUploadError(error: any) {
    console.error('Error en subida:', error);
    alert(`Error: ${error.error?.message || 'No se pudo subir el video'}`);
    this.resetUploadState();
  }

  private resetUploadState() {
    this.uploadInProgress = false;
    this.uploadProgress = null;
  }

  private resetUploadForm() {
    this.uploadForm.file = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  addYouTubeVideo() {
    if (!this.youtubeForm.url.includes('youtube.com') && !this.youtubeForm.url.includes('youtu.be')) {
      alert('URL de YouTube no válida');
      return;
    }

    const videoData: CreateVideoRequest = {
      title: this.youtubeForm.title,
      description: this.youtubeForm.description,
      url: this.youtubeForm.url,
      user_id: this.currentUser.id
    };

    this.videoService.addYouTubeVideo(videoData).subscribe({
      next: (newVideo) => {
        this.videos.unshift(newVideo);
        this.closeYoutubeModal();
      },
      error: (error) => {
        console.error('Error al agregar video:', error);
        alert(error.error?.message || 'Error al agregar video');
      }
    });
  }

  cacheVideo(video: Video, event?: Event) {
    event?.stopPropagation();
    
    if (this.isYoutubeUrl(video.url)) {
      alert('No se puede cachear videos de YouTube');
      return;
    }
    
    this.videoService.cacheVideo(video.id).subscribe({
      next: (updatedVideo) => {
        const index = this.videos.findIndex(v => v.id === video.id);
        if (index !== -1) this.videos[index] = updatedVideo;
        alert('Video disponible para visualización offline');
      },
      error: (error) => {
        console.error('Error al cachear:', error);
        alert(error.error?.message || 'Error al guardar para offline');
      }
    });
  }

  clearCache(video: Video, event?: Event) {
    event?.stopPropagation();
    
    this.videoService.clearCache(video.id).subscribe({
      next: () => {
        const index = this.videos.findIndex(v => v.id === video.id);
        if (index !== -1) {
          this.videos[index].is_cached = false;
          this.videos[index].local_path = undefined;
        }
        alert('Caché eliminado correctamente');
      },
      error: (error) => {
        console.error('Error al limpiar caché:', error);
        alert(error.error?.message || 'Error al eliminar caché');
      }
    });
  }

  getThumbnailUrl(url: string): string {
    return this.videoService.getThumbnailUrl(url);
  }

  openUploadModal() {
    this.showUploadModal = true;
    this.uploadForm = { title: '', description: '', file: null };
  }

  openYoutubeModal() {
    this.showYoutubeModal = true;
    this.youtubeForm = { title: '', description: '', url: '' };
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetUploadForm();
    this.resetUploadState();
  }

  closeYoutubeModal() {
    this.showYoutubeModal = false;
    this.youtubeForm = { title: '', description: '', url: '' };
  }

  closeVideoModal() {
    this.showVideoModal = false;
    this.currentVideo = null;
    this.safeVideoUrl = null;
  }

  logout() {
    this.usuarioService.logout();
  }
}