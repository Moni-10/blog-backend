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
const upload = multer({ storage: productStorage, limits: { fileSize: 8 * 1024 * 1024 } });
const productUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'galleryImages', maxCount: 12 },
  { name: 'outputImages', maxCount: 12 }
]);

const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (_) { return fallback; }
};
const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Create new product
router.post('/', adminAuth, productUploads, async (req, res) => {
  try {
    const { name, description, price, category, accessories } = req.body;
    const image = req.files?.image?.[0]?.filename || null;
    const galleryImages = (req.files?.galleryImages || []).map(file => file.filename);
    const outputFiles = req.files?.outputImages || [];
    const outputTitles = parseJson(req.body.outputTitles);

    const product = new Product({
      name,
      image,
      description,
      price,
      category,
      slug: slugify(req.body.slug || name),
      shortDescription: req.body.shortDescription || '',
      galleryImages,
      technicalSpecifications: parseJson(req.body.technicalSpecifications),
      relatedProducts: parseJson(req.body.relatedProducts),
      youtubeUrl: req.body.youtubeUrl || '',
      outputImages: outputFiles.map((file, index) => ({ image: file.filename, title: outputTitles[index] || '' })),
      faqs: parseJson(req.body.faqs),
      accessories: parseJson(accessories)
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
      .populate('accessories')
      .populate('relatedProducts', 'name image slug');
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
      .populate('accessories')
      .populate('relatedProducts', 'name image slug');

    if (!product) return res.status(404).send();
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Update product
router.patch('/:id', adminAuth, productUploads, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      ...(req.files?.image?.[0] && { image: req.files.image[0].filename }),
      ...(req.files?.galleryImages?.length && { galleryImages: req.files.galleryImages.map(file => file.filename) }),
      ...(req.body.accessories && { accessories: parseJson(req.body.accessories) }),
      ...(req.body.technicalSpecifications && { technicalSpecifications: parseJson(req.body.technicalSpecifications) }),
      ...(req.body.relatedProducts && { relatedProducts: parseJson(req.body.relatedProducts) }),
      ...(req.body.faqs && { faqs: parseJson(req.body.faqs) }),
      ...((req.body.slug || req.body.name) && { slug: slugify(req.body.slug || req.body.name) })
    };
    if (req.files?.outputImages?.length) {
      const titles = parseJson(req.body.outputTitles);
      updates.outputImages = req.files.outputImages.map((file, index) => ({ image: file.filename, title: titles[index] || '' }));
    }

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
