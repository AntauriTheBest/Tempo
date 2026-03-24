"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEstimatedTimeSchema = exports.createTimeEntrySchema = void 0;
const zod_1 = require("zod");
exports.createTimeEntrySchema = zod_1.z.object({
    taskId: zod_1.z.string().cuid(),
    type: zod_1.z.enum(['POMODORO', 'MANUAL']).default('POMODORO'),
    durationMinutes: zod_1.z.number().int().min(1).max(480),
    startedAt: zod_1.z.string().datetime(),
    endedAt: zod_1.z.string().datetime().optional(),
});
exports.updateEstimatedTimeSchema = zod_1.z.object({
    estimatedTimeMinutes: zod_1.z.number().int().min(0).max(9999).nullable(),
});
//# sourceMappingURL=time-entry.validators.js.map