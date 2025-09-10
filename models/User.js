const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    }
  },
  stats: {
    totalTests: {
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
    },
    bestWPM: {
      type: Number,
      default: 0
    },
    bestAccuracy: {
      type: Number,
      default: 0
    },
    totalTimeTyped: {
      type: Number,
      default: 0 // in seconds
    }
  },
  preferences: {
    preferredDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    preferredDuration: {
      type: Number,
      default: 60 // in seconds
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.bestWPM': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update user stats
userSchema.methods.updateStats = function(testResult) {
  this.stats.totalTests += 1;
  this.stats.totalTimeTyped += testResult.duration;
  
  // Update best scores
  if (testResult.wpm > this.stats.bestWPM) {
    this.stats.bestWPM = testResult.wpm;
  }
  if (testResult.accuracy > this.stats.bestAccuracy) {
    this.stats.bestAccuracy = testResult.accuracy;
  }
  
  // Calculate new averages
  this.stats.averageWPM = ((this.stats.averageWPM * (this.stats.totalTests - 1)) + testResult.wpm) / this.stats.totalTests;
  this.stats.averageAccuracy = ((this.stats.averageAccuracy * (this.stats.totalTests - 1)) + testResult.accuracy) / this.stats.totalTests;
  
  // Round to 2 decimal places
  this.stats.averageWPM = Math.round(this.stats.averageWPM * 100) / 100;
  this.stats.averageAccuracy = Math.round(this.stats.averageAccuracy * 100) / 100;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
