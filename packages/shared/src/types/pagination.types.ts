export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
