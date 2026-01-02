
import { Component, output, signal, computed, OnDestroy, input, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimerCategory, CountdownTimer } from '../models/timer.model';

@Component({
  selector: 'app-timer-form',
  imports: [FormsModule],
  template: `
    <div class="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
      <!-- Decorative background glow -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[80px] pointer-events-none"></div>
      
      <div class="relative z-10">
        <header class="mb-8">
          <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-sm">
              @if (timerToEdit()) {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              }
            </span>
            {{ timerToEdit() ? 'Update Countdown' : 'New Countdown' }}
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            {{ timerToEdit() ? 'Modify your existing milestone details.' : 'Define your next milestone with precision.' }}
          </p>
        </header>

        <div class="space-y-6">
          <!-- Title Input Group -->
          <div class="space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Event Title</label>
            <div class="relative group">
              <input 
                [(ngModel)]="title" 
                type="text" 
                placeholder="Ex: Product Launch, Marathon, Vacation..."
                class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-slate-900 transition-all duration-300 hover:border-slate-600 shadow-inner"
              >
            </div>
          </div>
          
          <!-- Date and Time Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Target Date</label>
              <input 
                [(ngModel)]="date" 
                type="date"
                class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-slate-900 transition-all duration-300 hover:border-slate-600 color-scheme-dark"
              >
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Target Time</label>
              <input 
                [(ngModel)]="time" 
                type="time"
                class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-slate-900 transition-all duration-300 hover:border-slate-600 color-scheme-dark"
              >
            </div>
          </div>

          <!-- Category Select -->
          <div class="space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Activity Category</label>
            <select 
              [(ngModel)]="category"
              class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-slate-900 transition-all duration-300 hover:border-slate-600 appearance-none cursor-pointer"
            >
              @for (cat of categories; track cat) {
                <option [value]="cat">{{cat}}</option>
              }
            </select>
          </div>

          <!-- Description Input (Optional) -->
          <div class="space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Description (Optional)</label>
            <textarea 
              [(ngModel)]="description" 
              placeholder="Add more context or notes about this milestone..."
              rows="3"
              class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-slate-900 transition-all duration-300 hover:border-slate-600 shadow-inner resize-none"
            ></textarea>
          </div>

          <!-- Color Theme Selection -->
          <div class="space-y-3">
            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 ml-1">Identity Color</label>
            <div class="flex flex-wrap gap-4 p-4 bg-slate-900/30 rounded-2xl border border-slate-700/30">
              @for (color of colors; track color) {
                <button 
                  (click)="selectedColor.set(color)"
                  class="w-10 h-10 rounded-xl border-2 transition-all duration-300 hover:scale-110 active:scale-95 relative"
                  [style.background-color]="color"
                  [style.border-color]="selectedColor() === color ? 'white' : 'transparent'"
                  [class.shadow-[0_0_20px_rgba(255,255,255,0.2)]]="selectedColor() === color"
                >
                  @if (selectedColor() === color) {
                    <span class="absolute inset-0 flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Submit Button Group -->
          <div class="pt-4 flex flex-col sm:flex-row gap-4">
            <button 
              (click)="submit()"
              class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.25rem] transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.97] flex items-center justify-center gap-3 group overflow-hidden relative"
            >
              <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              {{ timerToEdit() ? 'Save Updates' : 'Initialize Countdown' }}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            @if (timerToEdit()) {
              <button 
                (click)="onCancel.emit()"
                class="px-8 py-5 border border-slate-700 text-slate-400 font-black rounded-[1.25rem] hover:bg-slate-800 transition-all active:scale-95"
              >
                Cancel
              </button>
            }
          </div>

          <!-- Automatically Updating Timestamp -->
          <div class="mt-8 flex flex-col items-center border-t border-slate-700/30 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <span class="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mb-2">SYSTEM TIME REFERENCE</span>
            <div class="flex items-center gap-3 px-4 py-2 bg-indigo-500/5 rounded-full border border-indigo-500/10">
               <div class="relative flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
               </div>
               <span class="text-[11px] text-indigo-400 font-mono font-bold tracking-tight">
                 {{ formattedNow() }}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .color-scheme-dark {
      color-scheme: dark;
    }
  `]
})
export class TimerFormComponent implements OnDestroy {
  timerToEdit = input<CountdownTimer | null>(null);
  
  title = '';
  description = '';
  date = '';
  time = '00:00';
  category: TimerCategory = 'Personal';
  selectedColor = signal('#6366f1');

  categories: TimerCategory[] = ['Work', 'Personal', 'Health', 'Travel', 'Event', 'Other'];
  colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  onAdd = output<any>();
  onCancel = output<void>();
  
  private now = signal(new Date());
  private intervalId: any;

  formattedNow = computed(() => {
    const d = this.now();
    const datePart = d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timePart = d.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
    return `${datePart} • ${timePart}`;
  });

  constructor() {
    this.intervalId = setInterval(() => {
      this.now.set(new Date());
    }, 1000);

    // Sync form values when timerToEdit changes
    effect(() => {
      const timer = this.timerToEdit();
      if (timer) {
        this.title = timer.title;
        this.description = timer.description || '';
        this.category = timer.category;
        this.selectedColor.set(timer.color);
        const target = new Date(timer.targetDate);
        this.date = target.toISOString().split('T')[0];
        this.time = target.toTimeString().slice(0, 5);
      } else {
        this.resetForm();
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private resetForm() {
    this.title = '';
    this.description = '';
    this.date = '';
    this.time = '00:00';
    this.category = 'Personal';
    this.selectedColor.set('#6366f1');
  }

  submit() {
    if (!this.title || !this.date) return;
    
    const targetDate = new Date(`${this.date}T${this.time}`).toISOString();
    
    this.onAdd.emit({
      title: this.title,
      description: this.description,
      targetDate,
      category: this.category,
      color: this.selectedColor()
    });

    this.resetForm();
  }
}