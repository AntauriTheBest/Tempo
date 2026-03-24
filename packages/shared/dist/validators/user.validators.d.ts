import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatar?: string | null | undefined;
    phone?: string | null | undefined;
}, {
    name?: string | undefined;
    avatar?: string | null | undefined;
    phone?: string | null | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
//# sourceMappingURL=user.validators.d.ts.map