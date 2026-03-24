"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlySchema = exports.createRecurrenceSchema = void 0;
const zod_1 = require("zod");
exports.createRecurrenceSchema = zod_1.z.object({
    frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: zod_1.z.number().int().min(1).max(12).default(1),
    dayOfMonth: zod_1.z.number().int().min(1).max(28).optional(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
});
exports.generateMonthlySchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2020).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
});
//# sourceMappingURL=recurrence.validators.js.map