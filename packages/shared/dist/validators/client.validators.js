"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientSchema = exports.createClientSchema = void 0;
const zod_1 = require("zod");
const emptyToUndefined = (val) => (val === '' ? undefined : val);
const emptyToNull = (val) => (val === '' ? null : val);
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#10b981'),
    contactName: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().max(200).optional()),
    contactEmail: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().email().max(200).optional()),
    contactPhone: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().max(50).optional()),
});
exports.updateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    contactName: zod_1.z.preprocess(emptyToNull, zod_1.z.string().max(200).nullable().optional()),
    contactEmail: zod_1.z.preprocess(emptyToNull, zod_1.z.string().email().max(200).nullable().optional()),
    contactPhone: zod_1.z.preprocess(emptyToNull, zod_1.z.string().max(50).nullable().optional()),
});
//# sourceMappingURL=client.validators.js.map