"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).trim(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#6366f1'),
    icon: zod_1.z.string().max(50).optional(),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).trim().optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    icon: zod_1.z.string().max(50).nullable().optional(),
});
exports.reorderSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().cuid(),
        order: zod_1.z.number().int().min(0),
    }))
        .min(1),
});
//# sourceMappingURL=category.validators.js.map