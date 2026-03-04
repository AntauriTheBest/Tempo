export type TimeEntryType = 'POMODORO' | 'MANUAL';

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  type: TimeEntryType;
  durationMinutes: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  task?: { id: string; title: string };
  user?: { id: string; name: string };
}

export interface CreateTimeEntryRequest {
  taskId: string;
  type: TimeEntryType;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string;
}

export interface TaskTimeStats {
  totalMinutes: number;
  pomodoroSessions: number;
  estimatedTimeMinutes: number | null;
}
