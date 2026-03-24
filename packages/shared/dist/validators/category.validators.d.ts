import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
    icon?: string | undefined;
}, {
    name: string;
    color?: string | undefined;
    icon?: string | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    color?: string | undefined;
    icon?: string | null | undefined;
}, {
    name?: string | undefined;
    color?: string | undefined;
    icon?: string | null | undefined;
}>;
export declare const reorderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        order: number;
        id: string;
    }, {
        order: number;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        order: number;
        id: string;
    }[];
}, {
    items: {
        order: number;
        id: string;
    }[];
}>;
//# sourceMappingURL=category.validators.d.ts.map