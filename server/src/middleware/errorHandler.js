export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Resource not found" });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details || undefined
  });
}
