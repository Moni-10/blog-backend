const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 30 },
  company: { type: String, trim: true, maxlength: 140 },
  subject: { type: String, trim: true, maxlength: 180 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  websiteDomain: { type: String, trim: true, lowercase: true, index: true },
  sourcePage: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ["new", "contacted", "closed", "spam"], default: "new", index: true },
  notes: { type: String, default: "", maxlength: 3000 },
  readAt: { type: Date, default: null },
}, { timestamps: true });

InquirySchema.index({ createdAt: -1 });
module.exports = mongoose.model("Inquiry", InquirySchema);
