export interface Pagination {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    items: T[];
    metadata: Pagination;
}