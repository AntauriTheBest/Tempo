export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    _count?: {
        tasks: number;
    };
}
export interface CreateCategoryRequest {
    name: string;
    color?: string;
    icon?: string;
}
export interface UpdateCategoryRequest {
    name?: string;
    color?: string;
    icon?: string;
}
export interface ReorderRequest {
    items: {
        id: string;
        order: number;
    }[];
}
//# sourceMappingURL=category.types.d.ts.map