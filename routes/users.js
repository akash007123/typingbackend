const express = require('express');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { auth } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        stats: user.stats,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, validateProfileUpdate, async (req, res) => {
  try {
    const { firstName, lastName, preferredDifficulty, preferredDuration, theme } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    
    // Update preferences
    if (preferredDifficulty !== undefined) user.preferences.preferredDifficulty = preferredDifficulty;
    if (preferredDuration !== undefined) user.preferences.preferredDuration = preferredDuration;
    if (theme !== undefined) user.preferences.theme = theme;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const detailedStats = await TestResult.getUserStats(req.user.id);
    
    res.json({
      stats: {
        ...user.stats.toObject(),
        ...(detailedStats[0] || {})
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/history
// @desc    Get user test history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const results = await TestResult.find({ user: req.user.id })
      .populate('test', 'title difficulty category duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await TestResult.countDocuments({ user: req.user.id });
    
    res.json({
      results,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/best-results
// @desc    Get user's best results
// @access  Private
router.get('/best-results', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bestResults = await TestResult.getUserBestResults(req.user.id, limit);
    
    res.json({ results: bestResults });
  } catch (error) {
    console.error('Get best results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/progress
// @desc    Get user progress over time
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const progress = await TestResult.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          avgWPM: { $avg: "$wpm" },
          avgAccuracy: { $avg: "$accuracy" },
          testCount: { $sum: 1 },
          bestWPM: { $max: "$wpm" },
          bestAccuracy: { $max: "$accuracy" }
        }
      },
      {
        $project: {
          date: "$_id",
          avgWPM: { $round: ["$avgWPM", 2] },
          avgAccuracy: { $round: ["$avgAccuracy", 2] },
          testCount: 1,
          bestWPM: { $round: ["$bestWPM", 2] },
          bestAccuracy: { $round: ["$bestAccuracy", 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to deactivate account' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    
    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
