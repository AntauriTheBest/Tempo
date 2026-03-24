export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}
export type SortDirection = 'asc' | 'desc';
//# sourceMappingURL=common.types.d.ts.map