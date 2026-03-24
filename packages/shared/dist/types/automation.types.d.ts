export type AutomationTrigger = 'TASK_COMPLETED' | 'TASK_CREATED' | 'STATUS_CHANGED' | 'DUE_DATE_APPROACHING';
export type AutomationActionType = 'NOTIFY_ASSIGNEES' | 'NOTIFY_USER' | 'SET_STATUS' | 'SET_ASSIGNEE';
export interface Automation {
    id: string;
    name: string;
    organizationId: string;
    createdById: string;
    createdBy?: {
        id: string;
        name: string;
        avatar?: string | null;
    };
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
export declare const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string>;
export declare const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string>;
//# sourceMappingURL=automation.types.d.ts.map