
import { Component, output, signal, computed, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimerCategory } from '../models/timer.model';

@Component({
  selector: 'app-timer-form',
  imports: [FormsModule],
  template: `
    <div class="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl">
      <h2 class="text-xl font-bold mb-4 text-indigo-400">New Countdown</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Title</label>
          <input 
            [(ngModel)]="title" 
            type="text" 
            placeholder="What are we counting down to?"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Target Date</label>
            <input 
              [(ngModel)]="date" 
              type="date"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Target Time</label>
            <input 
              [(ngModel)]="time" 
              type="time"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</label>
          <select 
            [(ngModel)]="category"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            @for (cat of categories; track cat) {
              <option [value]="cat">{{cat}}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Color Theme</label>
          <div class="flex gap-2">
            @for (color of colors; track color) {
              <button 
                (click)="selectedColor.set(color)"
                [class.ring-2]="selectedColor() === color"
                [class.ring-white]="selectedColor() === color"
                [style.background-color]="color"
                class="w-8 h-8 rounded-full border border-white/20 transition-transform active:scale-90"
              ></button>
            }
          </div>
        </div>

        <button 
          (click)="submit()"
          class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          Create Countdown
        </button>

        <!-- Automatically Updating Timestamp -->
        <div class="mt-4 flex flex-col items-center border-t border-slate-700/50 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <span class="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Initial Entry Timestamp</span>
          <div class="flex items-center gap-2">
             <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
             <span class="text-xs text-indigo-400 font-mono font-medium tracking-tight">
               {{ formattedNow() }}
             </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TimerFormComponent implements OnDestroy {
  title = '';
  date = '';
  time = '00:00';
  category: TimerCategory = 'Personal';
  selectedColor = signal('#6366f1');

  categories: TimerCategory[] = ['Work', 'Personal', 'Health', 'Travel', 'Event', 'Other'];
  colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  onAdd = output<any>();
  
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
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  submit() {
    if (!this.title || !this.date) return;
    
    const targetDate = new Date(`${this.date}T${this.time}`).toISOString();
    
    this.onAdd.emit({
      title: this.title,
      targetDate,
      category: this.category,
      color: this.selectedColor()
    });

    this.title = '';
    this.date = '';
  }
}
