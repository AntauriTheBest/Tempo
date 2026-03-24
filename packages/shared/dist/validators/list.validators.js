"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateListSchema = exports.createListSchema = void 0;
const zod_1 = require("zod");
exports.createListSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    description: zod_1.z.string().max(500).optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#3b82f6'),
    icon: zod_1.z.string().max(50).optional(),
    clientId: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().cuid().optional()),
});
exports.updateListSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
    description: zod_1.z.string().max(500).nullable().optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    icon: zod_1.z.string().max(50).nullable().optional(),
    clientId: zod_1.z.preprocess((val) => (val === '' ? null : val), zod_1.z.string().cuid().nullable().optional()),
});
//# sourceMappingURL=list.validators.js.map