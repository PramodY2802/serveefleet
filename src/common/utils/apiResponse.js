export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, details) => {
  const payload = {
    status: 'error',
    message,
  };

  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};
