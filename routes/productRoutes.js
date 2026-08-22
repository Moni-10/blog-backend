const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const adminAuth = require('../middleware/adminAuth');

// Multer setup
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: productStorage });

// Create new product
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, accessories } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = new Product({
      name,
      image,
      description,
      price,
      category,
      accessories: accessories ? JSON.parse(accessories) : []   // IMPORTANT
    });

    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .populate('accessories');
    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Get specific product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('accessories');

    if (!product) return res.status(404).send();
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Update product
router.patch('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      ...(req.file && { image: req.file.filename }),
      ...(req.body.accessories && { accessories: JSON.parse(req.body.accessories) })
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!product) return res.status(404).send();
    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).send();
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
