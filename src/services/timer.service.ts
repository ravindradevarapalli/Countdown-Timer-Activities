
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { CountdownTimer, TimeLeft } from '../models/timer.model';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly STORAGE_KEY = 'chronos_timers';
  private notificationService = inject(NotificationService);
  
  private timersSignal = signal<CountdownTimer[]>(this.loadFromStorage());
  public timers = this.timersSignal.asReadonly();
  
  public activeCount = computed(() => this.timersSignal().filter(t => !t.isArchived).length);
  public archivedCount = computed(() => this.timersSignal().filter(t => t.isArchived).length);

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
    const timers: CountdownTimer[] = data ? JSON.parse(data) : [];
    // Ensure all timers have an order property for backwards compatibility
    return timers.map((t, i) => ({ ...t, order: t.order ?? i }));
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

  addTimer(timer: Omit<CountdownTimer, 'id' | 'createdAt' | 'isCompleted' | 'isArchived' | 'order'>) {
    const currentTimers = this.timersSignal();
    const newTimer: CountdownTimer = {
      ...timer,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isCompleted: false,
      notified: false,
      isArchived: false,
      order: currentTimers.length
    };
    this.timersSignal.update(t => [...t, newTimer]);
  }

  updateTimer(id: string, updates: Partial<CountdownTimer>) {
    this.timersSignal.update(timers => 
      timers.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }

  reorderTimers(orderedTimers: CountdownTimer[]) {
    // We update the 'order' property for all timers in the signal
    // This assumes 'orderedTimers' is the full list or a correctly filtered subset
    this.timersSignal.update(current => {
      const updated = [...current];
      orderedTimers.forEach((timer, index) => {
        const found = updated.find(t => t.id === timer.id);
        if (found) {
          found.order = index;
        }
      });
      return updated.sort((a, b) => a.order - b.order);
    });
  }

  archiveTimer(id: string) {
    this.timersSignal.update(timers =>
      timers.map(t => t.id === id ? { ...t, isArchived: true } : t)
    );
  }

  unarchiveTimer(id: string) {
    this.timersSignal.update(timers =>
      timers.map(t => t.id === id ? { ...t, isArchived: false } : t)
    );
  }

  deleteTimer(id: string) {
    this.timersSignal.update(current => {
      const filtered = current.filter(timer => timer.id !== id);
      // Re-sequence to avoid gaps
      return filtered.map((t, i) => ({ ...t, order: i }));
    });
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
