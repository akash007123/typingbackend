const express = require('express');
const TestResult = require('../models/TestResult');
const TypingTest = require('../models/TypingTest');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/leaderboard/global
// @desc    Get global leaderboard
// @access  Public
router.get('/global', optionalAuth, async (req, res) => {
  try {
    const { limit = 50, difficulty, category, duration } = req.query;

    // Build match query for filtering
    let matchQuery = {};
    if (difficulty || category || duration) {
      const testQuery = {};
      if (difficulty) testQuery.difficulty = difficulty;
      if (category) testQuery.category = category;
      if (duration) testQuery.duration = parseInt(duration);

      const testIds = await TypingTest.find(testQuery).distinct('_id');
      matchQuery.test = { $in: testIds };
    }

    const leaderboard = await TestResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$user',
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalTests: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          totalTimeTyped: { $sum: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalTests: 1,
          totalTimeTyped: 1,
          score: {
            $add: [
              { $multiply: ['$bestWPM', 0.7] },
              { $multiply: ['$bestAccuracy', 0.3] }
            ]
          }
        }
      },
      { $sort: { score: -1, bestWPM: -1, bestAccuracy: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({ leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/test/:testId
// @desc    Get leaderboard for specific test
// @access  Public
router.get('/test/:testId', optionalAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { limit = 50 } = req.query;

    // Verify test exists
    const test = await TypingTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const leaderboard = await TestResult.aggregate([
      { $match: { test: test._id } },
      {
        $group: {
          _id: '$user',
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalAttempts: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          bestResult: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalAttempts: 1,
          score: {
            $add: [
              { $multiply: ['$bestWPM', 0.7] },
              { $multiply: ['$bestAccuracy', 0.3] }
            ]
          }
        }
      },
      { $sort: { score: -1, bestWPM: -1, bestAccuracy: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      test: {
        id: test._id,
        title: test.title,
        difficulty: test.difficulty,
        category: test.category
      },
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Get test leaderboard error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid test ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/weekly
// @desc    Get weekly leaderboard
// @access  Public
router.get('/weekly', optionalAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const leaderboard = await TestResult.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: '$user',
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalTests: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalTests: 1,
          score: {
            $add: [
              { $multiply: ['$bestWPM', 0.7] },
              { $multiply: ['$bestAccuracy', 0.3] }
            ]
          }
        }
      },
      { $sort: { score: -1, bestWPM: -1, bestAccuracy: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      period: 'weekly',
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/monthly
// @desc    Get monthly leaderboard
// @access  Public
router.get('/monthly', optionalAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const leaderboard = await TestResult.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$user',
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalTests: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalTests: 1,
          score: {
            $add: [
              { $multiply: ['$bestWPM', 0.7] },
              { $multiply: ['$bestAccuracy', 0.3] }
            ]
          }
        }
      },
      { $sort: { score: -1, bestWPM: -1, bestAccuracy: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      period: 'monthly',
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Get monthly leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user-rank/:userId
// @desc    Get user's rank in global leaderboard
// @access  Public
router.get('/user-rank/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all users ranked by score
    const allUsers = await TestResult.aggregate([
      {
        $group: {
          _id: '$user',
          bestWPM: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalTests: { $sum: 1 },
          avgWPM: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      {
        $project: {
          userId: '$_id',
          bestWPM: { $round: ['$bestWPM', 2] },
          bestAccuracy: { $round: ['$bestAccuracy', 2] },
          avgWPM: { $round: ['$avgWPM', 2] },
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          totalTests: 1,
          score: {
            $add: [
              { $multiply: ['$bestWPM', 0.7] },
              { $multiply: ['$bestAccuracy', 0.3] }
            ]
          }
        }
      },
      { $sort: { score: -1, bestWPM: -1, bestAccuracy: -1 } }
    ]);

    // Find user's rank
    const userRank = allUsers.findIndex(user => user.userId.toString() === userId) + 1;
    const userStats = allUsers.find(user => user.userId.toString() === userId);

    if (!userStats) {
      return res.status(404).json({ message: 'User not found in rankings' });
    }

    res.json({
      rank: userRank,
      totalUsers: allUsers.length,
      stats: userStats
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
