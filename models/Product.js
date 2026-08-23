const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  slug: { type: String, trim: true },
  shortDescription: { type: String, default: '' },
  galleryImages: [{ type: String }],
  technicalSpecifications: [{ label: { type: String }, value: { type: String } }],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  youtubeUrl: { type: String, default: '' },
  outputImages: [{ image: { type: String }, title: { type: String, default: '' } }],
  faqs: [{ question: { type: String }, answer: { type: String } }],

  // NEW FIELD
  accessories: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'AccPriceSchema' }
  ]
}, { timestamps: true });

ProductSchema.index({ slug: 1 }, { sparse: true });

module.exports = mongoose.model('Product', ProductSchema);
