const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TypingTest',
    required: true
  },
  wpm: {
    type: Number,
    required: true,
    min: [0, 'WPM cannot be negative']
  },
  accuracy: {
    type: Number,
    required: true,
    min: [0, 'Accuracy cannot be negative'],
    max: [100, 'Accuracy cannot exceed 100%']
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 second']
  },
  wordsTyped: {
    type: Number,
    required: true,
    min: [0, 'Words typed cannot be negative']
  },
  charactersTyped: {
    type: Number,
    required: true,
    min: [0, 'Characters typed cannot be negative']
  },
  correctCharacters: {
    type: Number,
    required: true,
    min: [0, 'Correct characters cannot be negative']
  },
  incorrectCharacters: {
    type: Number,
    required: true,
    min: [0, 'Incorrect characters cannot be negative']
  },
  errors: [{
    position: Number,
    expected: String,
    typed: String,
    timestamp: Number
  }],
  keystrokes: [{
    key: String,
    timestamp: Number,
    correct: Boolean
  }],
  completed: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
testResultSchema.index({ user: 1, createdAt: -1 });
testResultSchema.index({ test: 1 });
testResultSchema.index({ wpm: -1 });
testResultSchema.index({ accuracy: -1 });
testResultSchema.index({ user: 1, wpm: -1 });

// Calculate derived metrics before saving
testResultSchema.pre('save', function(next) {
  // Ensure consistency in calculations
  if (this.correctCharacters + this.incorrectCharacters !== this.charactersTyped) {
    this.charactersTyped = this.correctCharacters + this.incorrectCharacters;
  }
  
  // Recalculate accuracy if needed
  if (this.charactersTyped > 0) {
    this.accuracy = Math.round((this.correctCharacters / this.charactersTyped) * 100 * 100) / 100;
  }
  
  next();
});

// Static method to get user's best results
testResultSchema.statics.getUserBestResults = function(userId, limit = 10) {
  return this.find({ user: userId })
    .populate('test', 'title difficulty category')
    .sort({ wpm: -1, accuracy: -1 })
    .limit(limit);
};

// Static method to get leaderboard
testResultSchema.statics.getLeaderboard = function(testId = null, limit = 50) {
  const query = testId ? { test: testId } : {};
  
  return this.aggregate([
    { $match: query },
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
        username: '$user.username',
        bestWPM: { $round: ['$bestWPM', 2] },
        bestAccuracy: { $round: ['$bestAccuracy', 2] },
        avgWPM: { $round: ['$avgWPM', 2] },
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        totalTests: 1
      }
    },
    { $sort: { bestWPM: -1, bestAccuracy: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get user statistics
testResultSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        avgWPM: { $avg: '$wpm' },
        avgAccuracy: { $avg: '$accuracy' },
        bestWPM: { $max: '$wpm' },
        bestAccuracy: { $max: '$accuracy' },
        totalTimeTyped: { $sum: '$duration' }
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
        totalTimeTyped: 1
      }
    }
  ]);
};

module.exports = mongoose.model('TestResult', testResultSchema);
