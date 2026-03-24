import { z } from 'zod';
export declare const createRecurrenceSchema: z.ZodObject<{
    frequency: z.ZodEnum<["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]>;
    interval: z.ZodDefault<z.ZodNumber>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    interval: number;
    startDate: string;
    dayOfMonth?: number | undefined;
    endDate?: string | undefined;
}, {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate: string;
    interval?: number | undefined;
    dayOfMonth?: number | undefined;
    endDate?: string | undefined;
}>;
export declare const generateMonthlySchema: z.ZodObject<{
    year: z.ZodNumber;
    month: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    year: number;
    month: number;
}, {
    year: number;
    month: number;
}>;
//# sourceMappingURL=recurrence.validators.d.ts.map