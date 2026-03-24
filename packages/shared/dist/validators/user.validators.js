"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim().optional(),
    avatar: zod_1.z.string().url().nullable().optional(),
    phone: zod_1.z.string().regex(/^\d{7,15}$/, 'Formato inválido (solo dígitos, 7-15 caracteres)').nullable().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z
        .string()
        .min(8)
        .max(128)
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
});
//# sourceMappingURL=user.validators.js.map