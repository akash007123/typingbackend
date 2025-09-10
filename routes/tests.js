const express = require('express');
const TypingTest = require('../models/TypingTest');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tests
// @desc    Get typing tests with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      difficulty,
      category,
      duration,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (duration) query.duration = parseInt(duration);
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tests = await TypingTest.find(query)
      .select('-content') // Don't send content in list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TypingTest.countDocuments(query);

    res.json({
      tests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/random
// @desc    Get a random typing test
// @access  Public
router.get('/random', optionalAuth, async (req, res) => {
  try {
    const { difficulty, category, duration } = req.query;
    
    // Build query
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (duration) query.duration = parseInt(duration);

    const count = await TypingTest.countDocuments(query);
    if (count === 0) {
      return res.status(404).json({ message: 'No tests found matching criteria' });
    }

    const random = Math.floor(Math.random() * count);
    const test = await TypingTest.findOne(query).skip(random);

    res.json({ test });
  } catch (error) {
    console.error('Get random test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/:id
// @desc    Get specific typing test
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const test = await TypingTest.findById(req.params.id);
    
    if (!test || !test.isActive) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({ test });
  } catch (error) {
    console.error('Get test error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid test ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/categories/list
// @desc    Get all available categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await TypingTest.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/difficulties/list
// @desc    Get all available difficulties
// @access  Public
router.get('/difficulties/list', async (req, res) => {
  try {
    const difficulties = await TypingTest.distinct('difficulty', { isActive: true });
    res.json({ difficulties });
  } catch (error) {
    console.error('Get difficulties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/durations/list
// @desc    Get all available durations
// @access  Public
router.get('/durations/list', async (req, res) => {
  try {
    const durations = await TypingTest.distinct('duration', { isActive: true });
    res.json({ durations: durations.sort((a, b) => a - b) });
  } catch (error) {
    console.error('Get durations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
