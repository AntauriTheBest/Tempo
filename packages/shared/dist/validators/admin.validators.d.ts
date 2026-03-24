import { z } from 'zod';
export declare const inviteUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["ADMIN", "USER"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    role: "ADMIN" | "USER";
}, {
    name: string;
    email: string;
    role?: "ADMIN" | "USER" | undefined;
}>;
export declare const adminUpdateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "USER"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    role?: "ADMIN" | "USER" | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    role?: "ADMIN" | "USER" | undefined;
    isActive?: boolean | undefined;
}>;
//# sourceMappingURL=admin.validators.d.ts.map