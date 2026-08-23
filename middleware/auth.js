function requireAdmin(req, res, next) {
  const adminId = req.headers["x-admin-id"];

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "غير مصرح"
    });
  }

  req.adminId = adminId;
  next();
}

module.exports = {
  requireAdmin
};
