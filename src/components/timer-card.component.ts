
import { Component, input, output, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CountdownTimer, TimerCategory } from '../models/timer.model';
import { TimerService } from '../services/timer.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-timer-card',
  imports: [FormsModule],
  template: `
    <div 
      class="relative overflow-hidden transition-all duration-700 rounded-3xl p-6 group border shadow-2xl min-h-[420px] flex flex-col"
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
      @if (status() === 'warning' && !isEditing()) {
        <div class="absolute inset-0 border-2 border-amber-500/20 rounded-3xl animate-pulse pointer-events-none"></div>
      }

      <!-- Edit Mode Overlay -->
      @if (isEditing()) {
        <div class="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-40">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-indigo-400">Edit Countdown</h3>
            <button (click)="cancelEdit()" class="text-slate-500 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Title</label>
              <input 
                [(ngModel)]="editTitle" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Date</label>
                <input 
                  [(ngModel)]="editDate" 
                  type="date"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Time</label>
                <input 
                  [(ngModel)]="editTime" 
                  type="time"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Category</label>
              <select 
                [(ngModel)]="editCategory"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{cat}}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Color Theme</label>
              <div class="flex gap-2 py-1">
                @for (color of colors; track color) {
                  <button 
                    (click)="editColor = color"
                    [class.ring-2]="editColor === color"
                    [class.ring-white]="editColor === color"
                    [style.background-color]="color"
                    class="w-6 h-6 rounded-full border border-white/10 transition-transform active:scale-90"
                  ></button>
                }
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button 
              (click)="saveEdit()"
              class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-lg active:scale-95"
            >
              Save Changes
            </button>
            <button 
              (click)="cancelEdit()"
              class="px-4 py-2 border border-slate-700 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-800 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      } @else {
        <!-- Display View -->
        
        <!-- Reached Celebration Overlay -->
        @if (status() === 'completed' && !isAcknowledged()) {
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

        <div class="flex justify-between items-start mb-6 relative z-10">
          <div class="space-y-2">
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
            <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              {{ timer().title }}
            </h3>
          </div>
          
          <div class="flex gap-2">
            <button 
              (click)="startEdit()"
              class="text-slate-500 hover:text-indigo-400 transition-colors p-1 relative z-20"
              title="Edit Timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              (click)="onDelete.emit(timer().id)"
              class="text-slate-500 hover:text-red-400 transition-colors p-1 relative z-20"
              title="Delete Timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Countdown Display -->
        <div class="grid grid-cols-4 gap-2 mb-4 relative z-10" [class.opacity-40]="status() === 'completed'">
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
              {{ status() === 'completed' ? 'COMPLETED ON' : 'TARGET DEADLINE' }}
            </span>
            <span class="text-[10px] text-slate-400 font-medium">
              {{ formatDateTime(timer().targetDate) }}
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
      }
    </div>
  `
})
export class TimerCardComponent {
  timer = input.required<CountdownTimer>();
  onDelete = output<string>();
  
  private timerService = inject(TimerService);
  private geminiService = inject(GeminiService);
  
  isGenerating = signal(false);
  isAcknowledged = signal(false);
  isHoveringProgress = signal(false);
  isEditing = signal(false);
  isAnimatingStatus = signal(false);
  congratsMessage = signal<string | null>(null);

  // Constants
  private readonly TWENTY_FOUR_HOURS_MS = 86400000;
  private prevStatusValue: string | null = null;

  // Edit fields
  editTitle = '';
  editDate = '';
  editTime = '';
  editCategory: TimerCategory = 'Other';
  editColor = '';

  categories: TimerCategory[] = ['Work', 'Personal', 'Health', 'Travel', 'Event', 'Other'];
  colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  constructor() {
    // Generate congrats message on completion
    effect(async () => {
      if (this.status() === 'completed' && !this.congratsMessage()) {
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

  startEdit() {
    const target = new Date(this.timer().targetDate);
    this.editTitle = this.timer().title;
    this.editCategory = this.timer().category;
    this.editColor = this.timer().color;
    
    this.editDate = target.toISOString().split('T')[0];
    this.editTime = target.toTimeString().slice(0, 5);
    
    this.isEditing.set(true);
  }

  saveEdit() {
    const targetDate = new Date(`${this.editDate}T${this.editTime}`).toISOString();
    this.timerService.updateTimer(this.timer().id, {
      title: this.editTitle,
      category: this.editCategory,
      color: this.editColor,
      targetDate,
      isCompleted: new Date(targetDate).getTime() <= this.timerService.getNow(),
      notified: false
    });
    this.isEditing.set(false);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  formatDateTime(iso: string) {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${datePart} • ${timePart}`;
  }
}
