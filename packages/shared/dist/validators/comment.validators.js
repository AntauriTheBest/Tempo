"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'El comentario no puede estar vacío').max(2000, 'El comentario es demasiado largo'),
});
exports.updateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'El comentario no puede estar vacío').max(2000, 'El comentario es demasiado largo'),
});
//# sourceMappingURL=comment.validators.js.map