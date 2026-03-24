import { z } from 'zod';
export declare const createClientSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
    contactName: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    contactEmail: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    contactPhone: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
    contactName?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
}, {
    name: string;
    color?: string | undefined;
    contactName?: unknown;
    contactEmail?: unknown;
    contactPhone?: unknown;
}>;
export declare const updateClientSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    contactName: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null | undefined, unknown>;
    contactEmail: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null | undefined, unknown>;
    contactPhone: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    color?: string | undefined;
    contactName?: string | null | undefined;
    contactEmail?: string | null | undefined;
    contactPhone?: string | null | undefined;
}, {
    name?: string | undefined;
    color?: string | undefined;
    contactName?: unknown;
    contactEmail?: unknown;
    contactPhone?: unknown;
}>;
//# sourceMappingURL=client.validators.d.ts.map