const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
  });
};

export default notFoundHandler;
