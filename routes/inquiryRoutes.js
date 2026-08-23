const express = require("express");
const Inquiry = require("../models/Inquiry.js");
const adminAuth = require("../middleware/adminAuth.js");
const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    if (req.body.website) return res.status(200).json({ message: "Enquiry received" });
    const { name, email, phone, company, subject, message, websiteDomain, sourcePage } = req.body;
    if (!name?.trim() || !message?.trim() || (!email?.trim() && !phone?.trim())) {
      return res.status(400).json({ error: "Name, message, and email or phone are required" });
    }
    const inquiry = await Inquiry.create({ name, email, phone, company, subject, message, websiteDomain, sourcePage });
    res.status(201).json({ message: "Thank you. Your enquiry has been received.", inquiryId: inquiry._id });
  } catch (error) {
    res.status(400).json({ error: error.message || "Enquiry could not be submitted" });
  }
});

router.get("/", adminAuth, async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(inquiries);
});

router.get("/notifications", adminAuth, async (_req, res) => {
  const unread = await Inquiry.countDocuments({ readAt: null, status: { $ne: "spam" } });
  const recent = await Inquiry.find({ status: { $ne: "spam" } }).sort({ createdAt: -1 }).limit(5).select("name subject status createdAt readAt");
  res.json({ unread, recent });
});

router.patch("/:id", adminAuth, async (req, res) => {
  const allowed = {};
  for (const field of ["status", "notes", "readAt"]) if (req.body[field] !== undefined) allowed[field] = req.body[field];
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
  if (!inquiry) return res.status(404).json({ error: "Enquiry not found" });
  res.json(inquiry);
});

router.delete("/:id", adminAuth, async (req, res) => {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) return res.status(404).json({ error: "Enquiry not found" });
  res.json({ message: "Enquiry deleted" });
});

module.exports = router;
