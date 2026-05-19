export const buildSearchQuery = (searchableFields, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return {};

  const regex = new RegExp(searchTerm.trim(), 'i');

  return {
    $or: searchableFields.map((field) => ({ [field]: regex })),
  };
};

export const buildFilterQuery = (filters = {}) => {
  return Object.entries(filters).reduce((query, [key, value]) => {
    if (value === undefined || value === null || value === '') return query;
    query[key] = value;
    return query;
  }, {});
};
