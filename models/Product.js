const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

  // NEW FIELD
  accessories: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'AccPriceSchema' }
  ]
});

module.exports = mongoose.model('Product', ProductSchema);
