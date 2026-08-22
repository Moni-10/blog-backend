const express = require('express');
const router = express.Router();
const AccPrice = require('../models/AccPrice'); // Correct model name
const adminAuth = require('../middleware/adminAuth');

// ✅ Create new accessory price
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    const accPrice = new AccPrice({ name, price });
    await accPrice.save();

    res.status(201).json(accPrice);
  } catch (error) {
    console.error('Error creating accessory price:', error);
    res.status(500).json({ message: 'Failed to create record', error });
  }
});

// ✅ Get all accessory prices
router.get('/', async (req, res) => {
  try {
    const accPrices = await AccPrice.find();
    res.status(200).json(accPrices);
  } catch (error) {
    console.error('Error fetching accessory prices:', error);
    res.status(500).json({ message: 'Failed to fetch records', error });
  }
});

// ✅ Get single accessory price by ID
router.get('/:id', async (req, res) => {
  try {
    const accPrice = await AccPrice.findById(req.params.id);
    if (!accPrice) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(accPrice);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ message: 'Failed to fetch record', error });
  }
});

// ✅ Update accessory price
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    const accPrice = await AccPrice.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!accPrice) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(accPrice);
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(400).json({ message: 'Failed to update record', error });
  }
});

// ✅ Delete accessory price
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const accPrice = await AccPrice.findByIdAndDelete(req.params.id);
    if (!accPrice) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({ message: 'Record deleted successfully', accPrice });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Failed to delete record', error });
  }
});

module.exports = router;
