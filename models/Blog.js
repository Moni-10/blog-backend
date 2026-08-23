const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },

  title: { type: String, required: true },

  slug: { type: String, required: true, trim: true, lowercase: true },

  content: { type: String, required: true }, // full HTML

  excerpt: { type: String, default: "", maxlength: 500 },
  featuredImage: { type: String, default: "" },
  featuredImageAlt: { type: String, default: "" },

  images: {
    type: [String], // uploaded image URLs
    default: [],
  },

  tags: {
    type: [String],
    default: [],
  },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  authorName: { type: String, default: "Admin" },
  publishDate: { type: Date, default: null },

  focusKeyword: { type: String, default: "" },
  secondaryKeywords: { type: [String], default: [] },

  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeyword: { type: String },
  canonicalUrl: { type: String, default: "" },
  ogTitle: { type: String, default: "" },
  ogDescription: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  schemaType: { type: String, enum: ["Article", "BlogPosting"], default: "BlogPosting" },
  robotsIndex: { type: String, enum: ["index", "noindex"], default: "index" },
  robotsFollow: { type: String, enum: ["follow", "nofollow"], default: "follow" },

  faqs: { type: [{ question: { type: String, trim: true }, answer: { type: String, trim: true } }], default: [] },
  relatedProducts: { type: [mongoose.Schema.Types.ObjectId], ref: "Product", default: [] },
  relatedBlogs: { type: [mongoose.Schema.Types.ObjectId], ref: "Blog", default: [] },
  cta: {
    label: { type: String, default: "Get Quote" },
    url: { type: String, default: "/contact" },
  },
  youtubeUrl: { type: String, default: "" },
  internalLinks: { type: [{ label: String, url: String }], default: [] },
  externalLinks: { type: [{ label: String, url: String }], default: [] },

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
