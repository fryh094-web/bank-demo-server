function errorHandler(err, req, res, next) {
  console.error("Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    status: "failed",
    message: "حدث خطأ في الخادم"
  });
}

module.exports = errorHandler;
