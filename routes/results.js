const express = require('express');
const TestResult = require('../models/TestResult');
const TypingTest = require('../models/TypingTest');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validateTestResult } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/results
// @desc    Submit test result
// @access  Private
router.post('/', auth, validateTestResult, async (req, res) => {
  try {
    const {
      testId,
      wpm,
      accuracy,
      duration,
      wordsTyped,
      charactersTyped,
      correctCharacters,
      incorrectCharacters,
      errors,
      keystrokes,
      startTime,
      endTime
    } = req.body;

    // Verify test exists
    const test = await TypingTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Create test result
    const result = new TestResult({
      user: req.user.id,
      test: testId,
      wpm,
      accuracy,
      duration,
      wordsTyped,
      charactersTyped,
      correctCharacters,
      incorrectCharacters,
      errors: errors || [],
      keystrokes: keystrokes || [],
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    await result.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.updateStats({
      wpm,
      accuracy,
      duration
    });
    await user.save();

    // Update test statistics
    test.updateStatistics(wpm, accuracy);
    await test.save();

    // Populate the result for response
    await result.populate('test', 'title difficulty category');

    res.status(201).json({
      message: 'Test result saved successfully',
      result
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results
// @desc    Get user's test results
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      testId,
      difficulty,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    if (testId) query.test = testId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let results = TestResult.find(query)
      .populate('test', 'title difficulty category duration')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Add additional filters if needed
    if (difficulty || category) {
      results = results.populate({
        path: 'test',
        match: {
          ...(difficulty && { difficulty }),
          ...(category && { category })
        }
      });
    }

    results = await results;

    // Filter out results where test didn't match populate conditions
    if (difficulty || category) {
      results = results.filter(result => result.test);
    }

    const total = await TestResult.countDocuments(query);

    res.json({
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/:id
// @desc    Get specific test result
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await TestResult.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('test', 'title difficulty category duration content');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json({ result });
  } catch (error) {
    console.error('Get result error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid result ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete test result
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await TestResult.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    await TestResult.findByIdAndDelete(req.params.id);

    // Note: We're not updating user stats when deleting results
    // as this could complicate the statistics integrity

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid result ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/analytics/summary
// @desc    Get user's analytics summary
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const summary = await TestResult.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalTimeTyped: { $sum: '$duration' },
          totalWordsTyped: { $sum: '$wordsTyped' },
          totalCharactersTyped: { $sum: '$charactersTyped' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTests: 1,
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          totalTimeTyped: 1,
          totalWordsTyped: 1,
          totalCharactersTyped: 1
        }
      }
    ]);

    res.json({
      summary: summary[0] || {
        totalTests: 0,
        avgWPM: 0,
        avgAccuracy: 0,
        bestWPM: 0,
        bestAccuracy: 0,
        totalTimeTyped: 0,
        totalWordsTyped: 0,
        totalCharactersTyped: 0
      }
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
