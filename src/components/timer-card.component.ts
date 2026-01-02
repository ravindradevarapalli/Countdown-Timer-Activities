
import { Component, input, output, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CountdownTimer, TimerCategory } from '../models/timer.model';
import { TimerService } from '../services/timer.service';
import { GeminiService } from '../services/gemini.service';
import { NotificationService } from '../services/notification.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-timer-card',
  imports: [FormsModule],
  template: `
    <div 
      class="relative overflow-hidden transition-all duration-500 rounded-3xl p-6 group border shadow-2xl min-h-[420px] flex flex-col hover:scale-[1.02] hover:shadow-indigo-500/10 hover:border-slate-600/50"
      [style.border-top-color]="status() === 'completed' ? '#22c55e' : (status() === 'warning' ? '#f59e0b' : timer().color)"
      [style.border-top-width]="'4px'"
      [class]="statusClasses()"
      [class.animate-status-flash]="isAnimatingStatus()"
    >
      <!-- State-Specific Background Glows -->
      <div 
        class="absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000"
        [style.background]="glowGradient()"
      ></div>

      <!-- Warning Pulse for Nearing Completion -->
      @if (status() === 'warning') {
        <div class="absolute inset-0 border-2 border-amber-500/20 rounded-3xl animate-pulse pointer-events-none"></div>
      }

      <!-- Reached Celebration Overlay -->
      @if (status() === 'completed' && !isAcknowledged() && !timer().isArchived) {
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <div class="mb-4 relative">
            <div class="absolute inset-0 animate-ping opacity-25 rounded-full" [style.background-color]="timer().color"></div>
            <div class="w-16 h-16 rounded-full flex items-center justify-center relative z-10" [style.background-color]="timer().color">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Goal Achieved!</h2>
          <p class="text-slate-300 text-sm mb-6 max-w-[200px] font-medium italic">
            "{{ congratsMessage() || 'Mission Accomplished' }}"
          </p>

          <button 
            (click)="acknowledge()"
            class="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
            [style.background-color]="timer().color"
            style="color: white;"
          >
            Great!
          </button>
        </div>
      }

      <div class="flex justify-between items-start mb-4 relative z-10">
        <div class="space-y-2 flex-1 mr-4">
          <div class="flex items-center gap-2">
            <span 
              class="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded text-slate-300 inline-block bg-slate-900/80"
            >
              {{ timer().category }}
            </span>
            
            @switch (status()) {
              @case ('completed') {
                <span class="text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                  COMPLETED
                </span>
              }
              @case ('warning') {
                <span class="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 animate-pulse">
                  URGENT
                </span>
              }
              @default {
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-700/20 px-2 py-1 rounded">
                  {{ totalDuration() }}
                </span>
              }
            }
          </div>
          <div class="space-y-1">
            <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
              {{ timer().title }}
            </h3>
            @if (timer().description) {
              <p class="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                {{ timer().description }}
              </p>
            }
          </div>
        </div>
        
        <div class="flex gap-1 shrink-0">
          <!-- Drag Handle -->
          <div class="relative">
            <div 
              (mouseenter)="isHoveringDrag.set(true)"
              (mouseleave)="isHoveringDrag.set(false)"
              class="text-slate-600 hover:text-slate-300 p-2 cursor-grab active:cursor-grabbing transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>
            @if (isHoveringDrag()) {
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[9px] font-black text-slate-300 uppercase tracking-wider whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                Hold to Drag
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
              </div>
            }
          </div>

          <!-- Edit Button -->
          @if (!timer().isArchived) {
            <div class="relative">
              <button 
                (click)="onEdit.emit(timer().id)"
                (mouseenter)="isHoveringEdit.set(true)"
                (mouseleave)="isHoveringEdit.set(false)"
                class="text-slate-500 hover:text-indigo-400 transition-colors p-2 relative z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              @if (isHoveringEdit()) {
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-wider whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  Edit Timer
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                </div>
              }
            </div>
          }

          <!-- Archive/Unarchive Button -->
          <div class="relative">
            @if (!timer().isArchived) {
              <button 
                (click)="onArchive.emit(timer().id)"
                (mouseenter)="isHoveringArchive.set(true)"
                (mouseleave)="isHoveringArchive.set(false)"
                class="text-slate-500 hover:text-indigo-400 transition-colors p-2 relative z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              @if (isHoveringArchive()) {
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-wider whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  Archive Timer
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                </div>
              }
            } @else {
              <button 
                (click)="onUnarchive.emit(timer().id)"
                (mouseenter)="isHoveringArchive.set(true)"
                (mouseleave)="isHoveringArchive.set(false)"
                class="text-slate-500 hover:text-indigo-400 transition-colors p-2 relative z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              @if (isHoveringArchive()) {
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-wider whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  Restore Timer
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                </div>
              }
            }
          </div>

          <!-- Delete Button -->
          <div class="relative">
            <button 
              (click)="onDelete.emit(timer().id)"
              (mouseenter)="isHoveringDelete.set(true)"
              (mouseleave)="isHoveringDelete.set(false)"
              class="text-slate-500 hover:text-red-400 transition-colors p-2 relative z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            @if (isHoveringDelete()) {
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[9px] font-black text-red-400 uppercase tracking-wider whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                Delete Timer
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Countdown Display -->
      <div class="grid grid-cols-4 gap-2 mb-2 relative z-10" [class.opacity-40]="status() === 'completed'">
        @let timeLeft = timerInfo();
        
        <div class="text-center">
          <div class="text-2xl font-black text-white leading-none">{{ timeLeft.days }}</div>
          <div class="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Days</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-black text-white leading-none">{{ timeLeft.hours }}</div>
          <div class="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Hrs</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-black text-white leading-none">{{ timeLeft.minutes }}</div>
          <div class="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Mins</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-black text-white leading-none">{{ timeLeft.seconds }}</div>
          <div class="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Secs</div>
        </div>
      </div>

      <!-- Date Range Section -->
      <div class="flex justify-between items-center mb-6 px-1 relative z-10" [class.opacity-40]="status() === 'completed'">
         <div class="flex flex-col">
           <span class="text-[8px] font-black uppercase text-slate-600 tracking-widest">Since</span>
           <span class="text-[10px] text-slate-500 font-mono">{{ formatDateTime(timer().createdAt) }}</span>
         </div>
         <div class="flex-1 border-b border-dashed border-slate-800 mx-3 mb-1"></div>
         <div class="flex flex-col text-right">
           <span class="text-[8px] font-black uppercase text-slate-600 tracking-widest">Until</span>
           <span class="text-[10px] text-slate-400 font-mono font-bold">{{ formatDateTime(timer().targetDate) }}</span>
         </div>
      </div>

      <!-- Progress Bar Section -->
      <div 
        class="mb-6 relative z-20 group/progress"
        (mouseenter)="isHoveringProgress.set(true)"
        (mouseleave)="isHoveringProgress.set(false)"
      >
        <!-- Tooltip -->
        @if (isHoveringProgress() && status() !== 'completed') {
          <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div class="space-y-1.5">
              <div class="flex flex-col">
                <span class="text-[8px] uppercase font-black text-slate-500 tracking-tighter">Initialized</span>
                <span class="text-[10px] text-indigo-300 font-mono">{{ startTimeFormatted() }}</span>
              </div>
              <div class="h-[1px] bg-slate-800"></div>
              <div class="flex flex-col">
                <span class="text-[8px] uppercase font-black text-slate-500 tracking-tighter">Current Status</span>
                <span class="text-[10px] text-white font-mono">{{ currentTimeFormatted() }}</span>
              </div>
            </div>
            <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
          </div>
        }

        <div class="flex justify-between items-center mb-1.5" [class.opacity-40]="status() === 'completed'">
          <span class="text-[9px] font-bold uppercase tracking-widest" [class.text-amber-500]="status() === 'warning'" [class.text-slate-500]="status() !== 'warning'">
            {{ status() === 'warning' ? 'FINAL STRETCH' : 'PROGRESS JOURNEY' }}
          </span>
          <span class="text-[10px] font-bold transition-all duration-300" [class.text-amber-400]="status() === 'warning'" [class.text-slate-400]="status() !== 'warning'" [class.animate-pulse]="status() !== 'completed'">
            {{ progress().toFixed(1) }}%
          </span>
        </div>
        
        <div class="h-3 w-full bg-slate-900/80 rounded-full overflow-hidden relative border border-slate-700/50 cursor-help" [class.opacity-40]="status() === 'completed'">
          <div 
            class="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear rounded-full overflow-hidden"
            [style.width.%]="progress()"
            [style.background-color]="status() === 'completed' ? '#22c55e' : (status() === 'warning' ? '#f59e0b' : timer().color)"
          >
            <div class="absolute inset-0 w-[300%] h-full opacity-40 animate-shimmer bg-gradient-to-r from-transparent via-white/40 via-white/10 to-transparent"></div>
            <div class="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
          </div>
        </div>

        @if (status() !== 'completed' && progress() > 0 && progress() < 100) {
          <div class="absolute top-[30px] -ml-2 w-4 h-4 transition-all duration-1000 ease-linear z-10 pointer-events-none" [style.left.%]="progress()">
            <div class="absolute inset-0 rounded-full animate-ping opacity-40 scale-150" [style.background-color]="status() === 'warning' ? '#f59e0b' : timer().color"></div>
            <div class="w-full h-full rounded-full bg-white shadow-[0_0_15px_white] relative z-20 flex items-center justify-center">
               <div class="w-1.5 h-1.5 rounded-full" [style.background-color]="status() === 'warning' ? '#f59e0b' : timer().color"></div>
            </div>
          </div>
        }
      </div>

      <!-- AI Section -->
      <div class="relative min-h-[60px] z-10 flex-1">
        @if (status() === 'completed') {
          <div class="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
             <div class="flex items-center gap-2 mb-1">
               <span class="text-xs text-green-400 font-black uppercase tracking-widest">VICTORY NOTE</span>
               <span class="text-[12px] animate-bounce">🏆</span>
             </div>
             <p class="text-sm text-slate-300 italic leading-relaxed">
               "{{ congratsMessage() || 'Mission Accomplished! You stayed focused and saw it through.' }}"
             </p>
          </div>
        } @else if (timer().motivation) {
          <p class="text-sm text-slate-300 italic mb-4 leading-relaxed bg-slate-900/30 p-3 rounded-xl border border-slate-700/30">
            "{{ timer().motivation }}"
          </p>
        } @else {
          <div class="flex justify-center items-center h-full">
            <button 
              (click)="generateMotivation()"
              [disabled]="isGenerating()"
              class="text-xs flex items-center gap-2 font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-all py-2 px-4 rounded-full border border-indigo-500/20 bg-indigo-500/5 relative z-20"
            >
              @if (isGenerating()) {
                <span class="animate-spin text-lg">✦</span> thinking...
              } @else {
                <span>✦</span> Get AI Motivation
              }
            </button>
          </div>
        }
      </div>

      <!-- Footer Info -->
      <div class="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center z-10">
        <div class="flex flex-col">
          <span class="text-[9px] text-slate-600 uppercase font-black tracking-widest">
            Status Summary
          </span>
          <span class="text-[10px] text-slate-400 font-medium">
            {{ status() === 'completed' ? 'Finished successfully' : (status() === 'warning' ? 'Closing in soon' : 'On track') }}
          </span>
        </div>
        @if (status() === 'completed') {
          <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 animate-in fade-in slide-in-from-right-2 duration-500">
            <span class="text-[10px] font-black text-green-500 uppercase tracking-widest">SUCCESS</span>
            <span class="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"></span>
          </div>
        } @else if (status() === 'warning') {
          <span class="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
        } @else {
          <span class="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
        }
      </div>
    </div>
  `
})
export class TimerCardComponent {
  timer = input.required<CountdownTimer>();
  onDelete = output<string>();
  onArchive = output<string>();
  onUnarchive = output<string>();
  onEdit = output<string>();
  
  private timerService = inject(TimerService);
  private geminiService = inject(GeminiService);
  private notificationService = inject(NotificationService);
  
  isGenerating = signal(false);
  isAcknowledged = signal(false);
  isHoveringProgress = signal(false);
  isHoveringEdit = signal(false);
  isHoveringDelete = signal(false);
  isHoveringArchive = signal(false);
  isHoveringDrag = signal(false);
  isAnimatingStatus = signal(false);
  congratsMessage = signal<string | null>(null);

  // Constants
  private readonly TWENTY_FOUR_HOURS_MS = 86400000;
  private prevStatusValue: string | null = null;

  constructor() {
    // Generate congrats message on completion
    effect(async () => {
      if (this.status() === 'completed' && !this.timer().isArchived && !this.congratsMessage()) {
        this.notificationService.playCelebratorySound();
        
        // Trigger confetti burst
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [this.timer().color, '#ffffff', '#ffd700'],
          zIndex: 999
        });

        const msg = await this.geminiService.generateCongratulations(this.timer().title, this.timer().category);
        this.congratsMessage.set(msg);
      }
    });

    // Detect status changes to trigger animation
    effect(() => {
      const currentStatus = this.status();
      if (this.prevStatusValue !== null && this.prevStatusValue !== currentStatus) {
        this.isAnimatingStatus.set(true);
        setTimeout(() => this.isAnimatingStatus.set(false), 800);
      }
      this.prevStatusValue = currentStatus;
    });
  }

  timerInfo = computed(() => {
    return this.timerService.getTimeLeft(this.timer().targetDate);
  });

  status = computed((): 'completed' | 'warning' | 'active' => {
    const ms = this.timerInfo().totalMs;
    if (ms <= 0) return 'completed';
    if (ms <= this.TWENTY_FOUR_HOURS_MS) return 'warning';
    return 'active';
  });

  statusClasses = computed(() => {
    const s = this.status();
    if (s === 'completed') return 'bg-slate-900 border-green-500/30';
    if (s === 'warning') return 'bg-slate-800/60 backdrop-blur-md border-amber-500/40 ring-1 ring-amber-500/10 shadow-amber-500/10';
    return 'bg-slate-800/40 backdrop-blur-sm border-slate-700/50';
  });

  glowGradient = computed(() => {
    const s = this.status();
    const color = s === 'completed' ? '#22c55e' : (s === 'warning' ? '#f59e0b' : this.timer().color);
    return `radial-gradient(circle at top right, ${color}, transparent 60%)`;
  });

  startTimeFormatted = computed(() => {
    return this.formatDateTime(this.timer().createdAt);
  });

  currentTimeFormatted = computed(() => {
    const now = new Date(this.timerService.getNow());
    return this.formatDateTime(now.toISOString());
  });

  totalDuration = computed(() => {
    const start = new Date(this.timer().createdAt).getTime();
    const end = new Date(this.timer().targetDate).getTime();
    const diff = end - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    
    if (days > 0) return `${days}d ${hours}h span`;
    if (hours > 0) return `${hours}h ${mins}m span`;
    return `${mins}m total`;
  });

  progress = computed(() => {
    const start = new Date(this.timer().createdAt).getTime();
    const end = new Date(this.timer().targetDate).getTime();
    const now = this.timerService.getNow();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  });

  async generateMotivation() {
    this.isGenerating.set(true);
    const motivation = await this.geminiService.generateMotivation(this.timer().title, this.timer().category);
    this.timerService.updateMotivation(this.timer().id, motivation);
    this.isGenerating.set(false);
  }

  acknowledge() {
    this.isAcknowledged.set(true);
  }

  formatDateTime(iso: string) {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${datePart} • ${timePart}`;
  }
}