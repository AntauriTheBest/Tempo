export interface ReportPeriod {
    start: string;
    end: string;
    label: string;
}
export interface ReportSummary {
    totalTimeMinutes: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
}
export interface TimeByClientItem {
    clientId: string | null;
    clientName: string;
    clientColor: string;
    totalMinutes: number;
    pomodoroMinutes: number;
    manualMinutes: number;
}
export interface TimeByUserItem {
    userId: string;
    userName: string;
    totalMinutes: number;
    taskCount: number;
}
export interface CompletedOverTimeItem {
    date: string;
    count: number;
}
export interface ReportStats {
    period: ReportPeriod;
    summary: ReportSummary;
    timeByClient: TimeByClientItem[];
    tasksByStatus: Record<string, number>;
    completedOverTime: CompletedOverTimeItem[];
}
export interface AdminReportStats extends ReportStats {
    timeByUser: TimeByUserItem[];
}
//# sourceMappingURL=report.types.d.ts.map