const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const adminAuth = require('../middleware/adminAuth');

// Multer setup
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/categories/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: categoryStorage });

// Create a new category
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    const image = req.file ? req.file.filename : null;

    const category = new Category({ name, image, description, parent });
    await category.save();
    res.status(201).send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent');
    res.send(categories);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get specific category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent');
    if (!category) return res.status(404).send();
    res.send(category);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update category
router.patch('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      ...(req.file && { image: req.file.filename })
    };
    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!category) return res.status(404).send();
    res.send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete category
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).send();
    res.send(category);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
