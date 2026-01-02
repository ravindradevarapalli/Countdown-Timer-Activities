
export type TimerCategory = 'Work' | 'Personal' | 'Health' | 'Travel' | 'Event' | 'Other';

export interface CountdownTimer {
  id: string;
  title: string;
  description?: string;
  targetDate: string; // ISO string
  createdAt: string;
  category: TimerCategory;
  color: string;
  motivation?: string;
  isCompleted: boolean;
  notified?: boolean;
  isArchived?: boolean;
  order: number;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}