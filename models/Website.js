const mongoose = require("mongoose");

const WebsiteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  domain: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, trim: true, default: "" },
  platform: { type: String, enum: ["coded", "wordpress"], default: "coded" },
  active: { type: Boolean, default: true },
  faviconUrl: { type: String, default: "" },
  seo: {
    siteTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    defaultKeywords: { type: [String], default: [] },
    canonicalBase: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterHandle: { type: String, default: "" },
    googleSiteVerification: { type: String, default: "" },
    bingSiteVerification: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },
    googleTagManagerId: { type: String, default: "" },
  },
  technical: {
    robotsTxt: { type: String, default: "User-agent: *\nAllow: /" },
    htaccess: { type: String, default: "" },
    blogPath: { type: String, default: "/blog" },
    includeBlogsInSitemap: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

WebsiteSchema.pre("validate", function (next) {
  if (this.domain) {
    this.domain = this.domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
  next();
});

module.exports = mongoose.model("Website", WebsiteSchema);
