"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUserSchema = exports.inviteUserSchema = void 0;
const zod_1 = require("zod");
exports.inviteUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    name: zod_1.z.string().min(2).max(100).trim(),
    role: zod_1.z.enum(['ADMIN', 'USER']).default('USER'),
});
exports.adminUpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim().optional(),
    role: zod_1.z.enum(['ADMIN', 'USER']).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=admin.validators.js.map