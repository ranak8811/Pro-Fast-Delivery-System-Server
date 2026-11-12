export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  isPaginated: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const parsePagination = (
  queryPage?: unknown,
  queryLimit?: unknown,
  defaultLimit: number = 10,
): PaginationParams => {
  const isPaginated = queryPage !== undefined || queryLimit !== undefined;
  const page = Math.max(1, parseInt(String(queryPage || 1), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(queryLimit || defaultLimit), 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    isPaginated,
  };
};
