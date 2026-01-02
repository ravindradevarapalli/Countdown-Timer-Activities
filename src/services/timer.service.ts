
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { CountdownTimer, TimeLeft } from '../models/timer.model';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly STORAGE_KEY = 'chronos_timers';
  private notificationService = inject(NotificationService);
  
  private timersSignal = signal<CountdownTimer[]>(this.loadFromStorage());
  public timers = this.timersSignal.asReadonly();
  
  private currentTime = signal<number>(Date.now());

  constructor() {
    setInterval(() => {
      this.currentTime.set(Date.now());
      this.checkFinishedTimers();
    }, 1000);

    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.timersSignal()));
    });
  }

  private loadFromStorage(): CountdownTimer[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private checkFinishedTimers() {
    const now = this.currentTime();
    let updated = false;
    const currentTimers = this.timersSignal();

    const newTimers = currentTimers.map(timer => {
      const target = new Date(timer.targetDate).getTime();
      if (now >= target && !timer.notified) {
        this.notificationService.sendNotification(
          `Time's up: ${timer.title}`,
          `Your ${timer.category} countdown has reached zero!`
        );
        updated = true;
        return { ...timer, notified: true, isCompleted: true };
      }
      return timer;
    });

    if (updated) {
      this.timersSignal.set(newTimers);
    }
  }

  addTimer(timer: Omit<CountdownTimer, 'id' | 'createdAt' | 'isCompleted'>) {
    const newTimer: CountdownTimer = {
      ...timer,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isCompleted: false,
      notified: false
    };
    this.timersSignal.update(t => [...t, newTimer]);
  }

  updateTimer(id: string, updates: Partial<CountdownTimer>) {
    this.timersSignal.update(timers => 
      timers.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }

  deleteTimer(id: string) {
    this.timersSignal.update(t => t.filter(timer => timer.id !== id));
  }

  updateMotivation(id: string, motivation: string) {
    this.timersSignal.update(timers => 
      timers.map(t => t.id === id ? { ...t, motivation } : t)
    );
  }

  getTimeLeft(targetDate: string): TimeLeft {
    const now = this.currentTime();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds, totalMs: diff };
  }

  getNow() {
    return this.currentTime();
  }
}
