
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  permissionStatus = signal<NotificationPermission | 'unsupported'>('default');
  private audio: HTMLAudioElement;
  private celebrationAudio: HTMLAudioElement;

  constructor() {
    if (!('Notification' in window)) {
      this.permissionStatus.set('unsupported');
    } else {
      this.permissionStatus.set(Notification.permission);
    }
    // Subtle digital chime sound for regular alerts
    this.audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    // Distinct celebratory success chime for completion
    this.celebrationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  }

  async requestPermission(): Promise<boolean> {
    if (this.permissionStatus() === 'unsupported') return false;
    
    const permission = await Notification.requestPermission();
    this.permissionStatus.set(permission);
    return permission === 'granted';
  }

  sendNotification(title: string, body: string) {
    this.playSound();
    
    if (this.permissionStatus() === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://picsum.photos/100/100' // Placeholder icon
      });
    }
  }

  playSound() {
    this.audio.currentTime = 0;
    this.audio.play().catch(e => console.warn('Audio play failed:', e));
  }

  playCelebratorySound() {
    this.celebrationAudio.currentTime = 0;
    this.celebrationAudio.play().catch(e => console.warn('Celebration audio play failed:', e));
  }
}
