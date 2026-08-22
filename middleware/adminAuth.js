module.exports = function adminAuth(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    if (process.env.NODE_ENV === "production") return res.status(503).json({ error: "ADMIN_API_KEY is not configured" });
    return next();
  }
  if (req.get("x-admin-key") !== configuredKey) return res.status(401).json({ error: "Invalid or missing admin key" });
  next();
};
