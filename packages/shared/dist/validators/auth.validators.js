"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.setPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    orgName: zod_1.z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres').max(100),
    name: zod_1.z.string().min(2, 'Tu nombre debe tener al menos 2 caracteres').max(100),
    email: zod_1.z.string().email('Ingresa un email válido'),
    password: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128)
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.setPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Ingresa un email válido'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128)
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});
//# sourceMappingURL=auth.validators.js.map