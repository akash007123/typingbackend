const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Test result validation
const validateTestResult = [
  body('testId')
    .isMongoId()
    .withMessage('Invalid test ID'),
  
  body('wpm')
    .isFloat({ min: 0 })
    .withMessage('WPM must be a positive number'),
  
  body('accuracy')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 second'),
  
  body('wordsTyped')
    .isInt({ min: 0 })
    .withMessage('Words typed must be a non-negative integer'),
  
  body('charactersTyped')
    .isInt({ min: 0 })
    .withMessage('Characters typed must be a non-negative integer'),
  
  body('correctCharacters')
    .isInt({ min: 0 })
    .withMessage('Correct characters must be a non-negative integer'),
  
  body('incorrectCharacters')
    .isInt({ min: 0 })
    .withMessage('Incorrect characters must be a non-negative integer'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('preferredDifficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Preferred difficulty must be easy, medium, or hard'),
  
  body('preferredDuration')
    .optional()
    .isInt({ min: 15, max: 300 })
    .withMessage('Preferred duration must be between 15 and 300 seconds'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTestResult,
  validateProfileUpdate,
  handleValidationErrors
};
