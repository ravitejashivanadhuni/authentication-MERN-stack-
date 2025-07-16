# Advanced MERN Authentication System

A comprehensive authentication system built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring advanced registration and login functionality.

## Features

- User registration with real-time validation:
  - First name (required) and last name (optional)
  - Email validation with existence check
  - Password strength meter
  - Password requirements:
    - 8-16 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
  - Real-time password matching validation
- Email verification with OTP
- Social authentication:
  - Google OAuth
  - GitHub OAuth
- Secure login system
- Modern UI with Material-UI
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for sending OTP emails)
- Google OAuth credentials
- GitHub OAuth credentials

## Setup

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd mern-authentication
\`\`\`

2. Install dependencies:
\`\`\`bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
\`\`\`

3. Create a .env file in the root directory with the following variables:
\`\`\`
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail_email
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
\`\`\`

4. Start the development servers:
\`\`\`bash
# Start backend server (from root directory)
npm run dev

# Start frontend server (from client directory)
cd client
npm start
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/verify-otp - Verify OTP
- GET /api/auth/google - Google OAuth login
- GET /api/auth/github - GitHub OAuth login

## Security Features

- Password hashing using bcrypt
- JWT for authentication
- HTTP-only cookies
- CORS protection
- Rate limiting
- Input validation and sanitization
- Secure password requirements
- Email verification

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 