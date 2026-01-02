
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from './services/timer.service';
import { NotificationService } from './services/notification.service';
import { TimerCardComponent } from './components/timer-card.component';
import { TimerFormComponent } from './components/timer-form.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, TimerCardComponent, TimerFormComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  public timerService = inject(TimerService);
  public notificationService = inject(NotificationService);
  
  showForm = signal(false);

  handleAddTimer(timerData: any) {
    this.timerService.addTimer(timerData);
    this.showForm.set(false);
  }

  handleDelete(id: string) {
    this.timerService.deleteTimer(id);
  }

  enableNotifications() {
    this.notificationService.requestPermission();
  }

  get sortedTimers() {
    return [...this.timerService.timers()].sort((a, b) => 
      new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
  }
}
