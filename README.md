# Typing Test Backend API

A comprehensive Node.js backend API for a typing test application with user authentication, test management, results tracking, and leaderboards.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **User Management**: Profile management, statistics tracking, and preferences
- **Typing Tests**: CRUD operations for typing tests with filtering and categorization
- **Test Results**: Submit and track typing test results with detailed analytics
- **Leaderboards**: Global, weekly, monthly, and test-specific leaderboards
- **Statistics**: Comprehensive user and system-wide analytics
- **Security**: Rate limiting, CORS, input validation, and password hashing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, bcryptjs
- **Validation**: express-validator

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/typing-test
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` (or your specified PORT).

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| GET | `/me` | Get current user | Yes |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout user | Yes |
| PUT | `/change-password` | Change password | Yes |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| GET | `/stats` | Get user statistics | Yes |
| GET | `/history` | Get test history | Yes |
| GET | `/best-results` | Get best results | Yes |
| GET | `/progress` | Get progress over time | Yes |
| DELETE | `/account` | Deactivate account | Yes |

### Tests (`/api/tests`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get typing tests (with filters) | No |
| GET | `/random` | Get random test | No |
| GET | `/:id` | Get specific test | No |
| GET | `/categories/list` | Get all categories | No |
| GET | `/difficulties/list` | Get all difficulties | No |
| GET | `/durations/list` | Get all durations | No |

### Results (`/api/results`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Submit test result | Yes |
| GET | `/` | Get user results | Yes |
| GET | `/:id` | Get specific result | Yes |
| DELETE | `/:id` | Delete result | Yes |
| GET | `/analytics/summary` | Get analytics summary | Yes |

### Leaderboard (`/api/leaderboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/global` | Global leaderboard | No |
| GET | `/weekly` | Weekly leaderboard | No |
| GET | `/monthly` | Monthly leaderboard | No |
| GET | `/test/:testId` | Test-specific leaderboard | No |
| GET | `/user-rank/:userId` | Get user's rank | No |

## Data Models

### User
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  stats: {
    totalTests: Number,
    averageWPM: Number,
    averageAccuracy: Number,
    bestWPM: Number,
    bestAccuracy: Number,
    totalTimeTyped: Number
  },
  preferences: {
    preferredDifficulty: String,
    preferredDuration: Number,
    theme: String
  }
}
```

### TypingTest
```javascript
{
  title: String,
  content: String,
  difficulty: String, // 'easy', 'medium', 'hard'
  category: String,
  duration: Number,
  wordCount: Number,
  characterCount: Number,
  tags: [String],
  statistics: {
    totalAttempts: Number,
    averageWPM: Number,
    averageAccuracy: Number
  }
}
```

### TestResult
```javascript
{
  user: ObjectId,
  test: ObjectId,
  wpm: Number,
  accuracy: Number,
  duration: Number,
  wordsTyped: Number,
  charactersTyped: Number,
  correctCharacters: Number,
  incorrectCharacters: Number,
  errors: [Object],
  keystrokes: [Object],
  startTime: Date,
  endTime: Date
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire in 7 days by default. Use the refresh token endpoint to get new access tokens.

## Error Handling

The API returns consistent error responses:

```javascript
{
  "message": "Error description",
  "errors": [] // Validation errors (if applicable)
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers
- MongoDB injection protection

## Development

### Adding Sample Data

You can create sample typing tests by making POST requests to create tests (you'll need to implement admin routes or directly insert into MongoDB).

### Database Indexes

The application creates the following indexes for optimal performance:
- User email and username
- Test difficulty and category
- Result user and creation date
- Leaderboard queries

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a production MongoDB instance
3. Set secure JWT secrets
4. Configure proper CORS origins
5. Use a process manager like PM2

## Contributing

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling
4. Update documentation for new features

## License

MIT License
