export const buildPagination = ({ page = 1, limit = 20, sort = '-createdAt' }) => {
  const sanitizedPage = Number(page) > 0 ? Number(page) : 1;
  const sanitizedLimit = Number(limit) > 0 ? Number(limit) : 20;

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip: (sanitizedPage - 1) * sanitizedLimit,
    sort,
  };
};

export const buildPaginatedResponse = (data, total, page, limit) => ({
  metadata: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  },
  data,
});
