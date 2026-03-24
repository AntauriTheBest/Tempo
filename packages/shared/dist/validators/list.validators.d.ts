import { z } from 'zod';
export declare const createListSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    clientId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
    icon?: string | undefined;
    description?: string | undefined;
    clientId?: string | undefined;
}, {
    name: string;
    color?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    clientId?: unknown;
}>;
export declare const updateListSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    clientId: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    color?: string | undefined;
    icon?: string | null | undefined;
    description?: string | null | undefined;
    clientId?: string | null | undefined;
}, {
    name?: string | undefined;
    color?: string | undefined;
    icon?: string | null | undefined;
    description?: string | null | undefined;
    clientId?: unknown;
}>;
//# sourceMappingURL=list.validators.d.ts.map