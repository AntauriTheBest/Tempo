"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTagSchema = exports.createTagSchema = void 0;
const zod_1 = require("zod");
exports.createTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(30).trim(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#8b5cf6'),
});
exports.updateTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(30).trim().optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
});
//# sourceMappingURL=tag.validators.js.map