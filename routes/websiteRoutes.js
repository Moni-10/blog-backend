const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const Website = require("../models/Website.js");
const Blog = require("../models/Blog.js");
const adminAuth = require("../middleware/adminAuth.js");

const router = express.Router();
const faviconUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads", "favicons"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"].includes(file.mimetype)),
});

const normalizeDomain = (value) => value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" }[char]));

function handleError(res, error) {
  if (error.code === 11000) return res.status(409).json({ success: false, error: "Domain already exists" });
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ success: false, error: error.message });
  return res.status(500).json({ success: false, error: "Server error" });
}

router.post("/create", adminAuth, async (req, res) => {
  try {
    const { name, domain, description, platform, active } = req.body;
    const website = await Website.create({ name, domain, description, platform, active });
    res.status(201).json({ success: true, message: "Website added successfully", website });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/all", async (req, res) => {
  try {
    const websites = await Website.find({ active: { $ne: false } }).sort({ name: 1 });
    res.json({ success: true, websites });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/domain/:domain", async (req, res) => {
  try {
    const domain = req.params.domain.replace(/^www\./i, "").toLowerCase();
    const website = await Website.findOne({ domain, active: { $ne: false } });
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.json({ success: true, website });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/public/:domain/config", async (req, res) => {
  try {
    const website = await Website.findOne({ domain: normalizeDomain(req.params.domain), active: { $ne: false } });
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.json({ success: true, website: { id: website._id, name: website.name, domain: website.domain, platform: website.platform, faviconUrl: website.faviconUrl, seo: website.seo, blogPath: website.technical?.blogPath || "/blog" } });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/public/:domain/robots.txt", async (req, res) => {
  try {
    const website = await Website.findOne({ domain: normalizeDomain(req.params.domain), active: { $ne: false } });
    if (!website) return res.status(404).type("text/plain").send("Website not found");
    const robots = website.technical?.robotsTxt || "User-agent: *\nAllow: /";
    res.type("text/plain").send(`${robots.trim()}\nSitemap: https://${website.domain}/sitemap.xml\n`);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/public/:domain/sitemap.xml", async (req, res) => {
  try {
    const website = await Website.findOne({ domain: normalizeDomain(req.params.domain), active: { $ne: false } });
    if (!website) return res.status(404).type("text/plain").send("Website not found");
    const blogPath = (website.technical?.blogPath || "/blog").replace(/\/$/, "");
    const blogs = website.technical?.includeBlogsInSitemap === false ? [] : await Blog.find({ websiteId: website._id, status: "published" }).select("slug publishedAt createdAt").sort({ publishedAt: -1 });
    const urls = [`<url><loc>${escapeXml(`https://${website.domain}/`)}</loc></url>`, ...blogs.map((blog) => `<url><loc>${escapeXml(`https://${website.domain}${blogPath}/${blog.slug}`)}</loc><lastmod>${(blog.publishedAt || blog.createdAt).toISOString()}</lastmod></url>`)].join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/:id/settings", adminAuth, async (req, res) => {
  try {
    const website = await Website.findByIdAndUpdate(req.params.id, { $set: { seo: req.body.seo, technical: req.body.technical } }, { new: true, runValidators: true });
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.json({ success: true, website });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/:id/favicon", adminAuth, faviconUpload.single("favicon"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "ICO, PNG or SVG favicon up to 1 MB is required" });
    const relativeUrl = `/uploads/favicons/${req.file.filename}`;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const website = await Website.findByIdAndUpdate(req.params.id, { faviconUrl: `${baseUrl}${relativeUrl}` }, { new: true });
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.status(201).json({ success: true, faviconUrl: website.faviconUrl, website });
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const allowed = (({ name, domain, description, platform, active }) => ({ name, domain, description, platform, active }))(req.body);
    Object.keys(allowed).forEach((key) => allowed[key] === undefined && delete allowed[key]);
    const website = await Website.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.json({ success: true, website });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const website = await Website.findByIdAndDelete(req.params.id);
    if (!website) return res.status(404).json({ success: false, error: "Website not found" });
    res.json({ success: true, message: "Website deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
