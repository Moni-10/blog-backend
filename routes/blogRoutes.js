const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const Blog = require("../models/Blog.js");
const Website = require("../models/Website.js");
const adminAuth = require("../middleware/adminAuth.js");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "..", "uploads", "blogs");

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)),
});

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function handleError(res, error) {
  if (error.code === 11000) return res.status(409).json({ error: "This slug already exists for the selected website" });
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Server error" });
}

router.post("/create", adminAuth, async (req, res) => {
  try {
    const website = await Website.findById(req.body.websiteId);
    if (!website) return res.status(400).json({ error: "Valid websiteId is required" });
    const payload = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    if (payload.status === "published") payload.publishedAt = new Date();
    const blog = await Blog.create(payload);
    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/upload-image", adminAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A JPG, PNG, WebP or GIF image is required" });
  const relativeUrl = `/uploads/blogs/${req.file.filename}`;
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.status(201).json({ url: `${baseUrl}${relativeUrl}`, relativeUrl });
});

// Admin list; in production this requires x-admin-key.
router.get("/", adminAuth, async (req, res) => {
  try {
    const filter = req.query.websiteId ? { websiteId: req.query.websiteId } : {};
    const blogs = await Blog.find(filter).populate("websiteId", "name domain platform").populate("category", "name").sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    handleError(res, error);
  }
});

// Public feed used by coded sites and WordPress integrations.
router.get("/public/:domain", async (req, res) => {
  try {
    const domain = req.params.domain.replace(/^www\./i, "").toLowerCase();
    const website = await Website.findOne({ domain, active: { $ne: false } });
    if (!website) return res.status(404).json({ error: "Website not found" });
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filter = { websiteId: website._id, status: "published" };
    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Blog.countDocuments(filter),
    ]);
    res.json({ website, blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/public/:domain/:slug", async (req, res) => {
  try {
    const domain = req.params.domain.replace(/^www\./i, "").toLowerCase();
    const website = await Website.findOne({ domain, active: { $ne: false } });
    if (!website) return res.status(404).json({ error: "Website not found" });
    const blog = await Blog.findOne({ websiteId: website._id, slug: req.params.slug.toLowerCase(), status: "published" });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ website, blog });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/website/:websiteId", async (req, res) => {
  try {
    const blogs = await Blog.find({ websiteId: req.params.websiteId, status: "published" }).sort({ publishedAt: -1, createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const filter = { slug: req.params.slug.toLowerCase(), status: "published" };
    if (req.query.websiteId) filter.websiteId = req.query.websiteId;
    const blog = await Blog.findOne(filter);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/update/:id", adminAuth, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.slug || payload.title) payload.slug = slugify(payload.slug || payload.title);
    if (payload.status === "published") payload.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog updated", blog });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("websiteId", "name domain platform").populate("category", "name").populate("relatedProducts", "name image").populate("relatedBlogs", "title slug");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
