const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },

  title: { type: String, required: true },

  slug: { type: String, required: true, trim: true, lowercase: true },

  content: { type: String, required: true }, // full HTML

  images: {
    type: [String], // uploaded image URLs
    default: [],
  },

  tags: {
    type: [String],
    default: [],
  },

  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeyword: { type: String },

  createdBy: { type: String }, // SEO employee name or ID

  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  publishedAt: { type: Date, default: null },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BlogSchema.index({ websiteId: 1, slug: 1 }, { unique: true });

// Auto-generate slug if not provided
BlogSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  if (this.status === "published" && !this.publishedAt) this.publishedAt = new Date();
  next();
});

module.exports = mongoose.model("Blog", BlogSchema);
