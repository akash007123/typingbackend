const mongoose = require('mongoose');

const typingTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Test content is required'],
    minlength: [50, 'Content must be at least 50 characters long']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'programming', 'literature', 'business', 'science', 'quotes'],
    default: 'general'
  },
  language: {
    type: String,
    default: 'english'
  },
  duration: {
    type: Number,
    required: true,
    min: [15, 'Duration must be at least 15 seconds'],
    max: [300, 'Duration cannot exceed 300 seconds']
  },
  wordCount: {
    type: Number,
    required: true
  },
  characterCount: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for system-generated tests
  },
  tags: [{
    type: String,
    trim: true
  }],
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageWPM: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
typingTestSchema.index({ difficulty: 1, category: 1 });
typingTestSchema.index({ isActive: 1 });
typingTestSchema.index({ duration: 1 });

// Calculate word and character count before saving
typingTestSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.trim().split(/\s+/).length;
    this.characterCount = this.content.length;
  }
  next();
});

// Update test statistics
typingTestSchema.methods.updateStatistics = function(wpm, accuracy) {
  const totalAttempts = this.statistics.totalAttempts + 1;
  
  this.statistics.averageWPM = ((this.statistics.averageWPM * this.statistics.totalAttempts) + wpm) / totalAttempts;
  this.statistics.averageAccuracy = ((this.statistics.averageAccuracy * this.statistics.totalAttempts) + accuracy) / totalAttempts;
  this.statistics.totalAttempts = totalAttempts;
  
  // Round to 2 decimal places
  this.statistics.averageWPM = Math.round(this.statistics.averageWPM * 100) / 100;
  this.statistics.averageAccuracy = Math.round(this.statistics.averageAccuracy * 100) / 100;
};

module.exports = mongoose.model('TypingTest', typingTestSchema);
