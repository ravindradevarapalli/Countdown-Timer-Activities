
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from './services/timer.service';
import { NotificationService } from './services/notification.service';
import { TimerCardComponent } from './components/timer-card.component';
import { TimerFormComponent } from './components/timer-form.component';
import { CountdownTimer } from './models/timer.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, TimerCardComponent, TimerFormComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  public timerService = inject(TimerService);
  public notificationService = inject(NotificationService);
  
  showForm = signal(false);
  viewMode = signal<'active' | 'archived'>('active');
  draggedTimerId = signal<string | null>(null);
  editingTimerId = signal<string | null>(null);

  editingTimer = computed(() => {
    const id = this.editingTimerId();
    if (!id) return null;
    return this.timerService.timers().find(t => t.id === id) || null;
  });

  toggleForm() {
    if (this.showForm()) {
      this.closeForm();
    } else {
      this.editingTimerId.set(null);
      this.showForm.set(true);
    }
  }

  closeForm() {
    this.showForm.set(false);
    this.editingTimerId.set(null);
  }

  handleSaveTimer(timerData: any) {
    const editId = this.editingTimerId();
    if (editId) {
      // Update logic
      const targetTime = new Date(timerData.targetDate).getTime();
      this.timerService.updateTimer(editId, {
        ...timerData,
        isCompleted: targetTime <= this.timerService.getNow(),
        notified: false // Reset notification status for future alerts if time moved forward
      });
    } else {
      // Add logic
      this.timerService.addTimer(timerData);
    }
    this.closeForm();
  }

  handleEdit(id: string) {
    this.editingTimerId.set(id);
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleDelete(id: string) {
    this.timerService.deleteTimer(id);
    if (this.editingTimerId() === id) {
      this.closeForm();
    }
  }

  handleArchive(id: string) {
    this.timerService.archiveTimer(id);
  }

  handleUnarchive(id: string) {
    this.timerService.unarchiveTimer(id);
  }

  enableNotifications() {
    this.notificationService.requestPermission();
  }

  onDragStart(timer: CountdownTimer) {
    this.draggedTimerId.set(timer.id);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Required to allow drop
  }

  onDrop(targetTimer: CountdownTimer) {
    const draggedId = this.draggedTimerId();
    if (!draggedId || draggedId === targetTimer.id) {
      this.draggedTimerId.set(null);
      return;
    }

    const currentTimers = this.sortedTimers;
    const draggedIndex = currentTimers.findIndex(t => t.id === draggedId);
    const targetIndex = currentTimers.findIndex(t => t.id === targetTimer.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentTimers];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    this.timerService.reorderTimers(newOrder);
    this.draggedTimerId.set(null);
  }

  get sortedTimers() {
    const currentMode = this.viewMode();
    return [...this.timerService.timers()]
      .filter(t => currentMode === 'active' ? !t.isArchived : t.isArchived)
      .sort((a, b) => a.order - b.order);
  }
}
