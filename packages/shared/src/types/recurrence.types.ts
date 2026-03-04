export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceRule {
  id: string;
  taskId: string;
  frequency: RecurrenceFreq;
  interval: number;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface CreateRecurrenceRequest {
  frequency: RecurrenceFreq;
  interval?: number;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
}

export interface MonthlyClientReport {
  client: { id: string; name: string; color: string };
  totalTemplates: number;
  completedInstances: number;
  pendingInstances: number;
  tasks: MonthlyTaskStatus[];
}

export interface MonthlyTaskStatus {
  templateId: string;
  templateTitle: string;
  instanceId: string | null;
  status: string;
  completedAt: string | null;
  assignees: { id: string; name: string }[];
}
