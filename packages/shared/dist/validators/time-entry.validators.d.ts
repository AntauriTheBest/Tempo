import { z } from 'zod';
export declare const createTimeEntrySchema: z.ZodObject<{
    taskId: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["POMODORO", "MANUAL"]>>;
    durationMinutes: z.ZodNumber;
    startedAt: z.ZodString;
    endedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "POMODORO" | "MANUAL";
    taskId: string;
    durationMinutes: number;
    startedAt: string;
    endedAt?: string | undefined;
}, {
    taskId: string;
    durationMinutes: number;
    startedAt: string;
    type?: "POMODORO" | "MANUAL" | undefined;
    endedAt?: string | undefined;
}>;
export declare const updateEstimatedTimeSchema: z.ZodObject<{
    estimatedTimeMinutes: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    estimatedTimeMinutes: number | null;
}, {
    estimatedTimeMinutes: number | null;
}>;
//# sourceMappingURL=time-entry.validators.d.ts.map