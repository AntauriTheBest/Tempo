export type AutomationTrigger =
  | 'TASK_COMPLETED'
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'DUE_DATE_APPROACHING';

export type AutomationActionType =
  | 'NOTIFY_ASSIGNEES'
  | 'NOTIFY_USER'
  | 'SET_STATUS'
  | 'SET_ASSIGNEE';

export interface Automation {
  id: string;
  name: string;
  organizationId: string;
  createdById: string;
  createdBy?: { id: string; name: string; avatar?: string | null };
  trigger: AutomationTrigger;
  triggerConfig?: Record<string, any> | null;
  actionType: AutomationActionType;
  actionConfig: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRequest {
  name: string;
  trigger: AutomationTrigger;
  triggerConfig?: Record<string, any>;
  actionType: AutomationActionType;
  actionConfig: Record<string, any>;
}

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  TASK_COMPLETED: 'Cuando una tarea se completa',
  TASK_CREATED: 'Cuando se crea una tarea',
  STATUS_CHANGED: 'Cuando cambia el estado',
  DUE_DATE_APPROACHING: 'Cuando se acerca la fecha límite',
};

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  NOTIFY_ASSIGNEES: 'Notificar a los asignados',
  NOTIFY_USER: 'Notificar a un usuario específico',
  SET_STATUS: 'Cambiar estado de la tarea',
  SET_ASSIGNEE: 'Asignar a un usuario',
};
