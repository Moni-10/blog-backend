const mongoose = require('mongoose');

const AccPriceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.model('AccPriceSchema', AccPriceSchema);
