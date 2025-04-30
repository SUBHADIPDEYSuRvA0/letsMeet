# MeetClone - Google Meet Clone

A comprehensive video conferencing platform with WebRTC, Socket.io, and MongoDB integration.

## Features

- Video conferencing with WebRTC
- Real-time chat (group and private)
- Screen sharing
- Screen recording
- Camera rotation
- Mute/unmute audio and video
- Meeting room codes
- User authentication
- Admin panel
- API for integration
- MongoDB database
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/meetclone.git
cd meetclone
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a `.env` file based on `.env.example`:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update the `.env` file with your configuration.

5. Start the server:
\`\`\`bash
npm start
\`\`\`

For development with auto-restart:
\`\`\`bash
npm run dev
\`\`\`

## Project Structure

- `server.js` - Main entry point
- `models/` - MongoDB models
- `routes/` - Express routes
- `views/` - EJS templates
- `public/` - Static assets
- `middleware/` - Express middleware
- `config/` - Configuration files

## API Documentation

The API allows you to programmatically create and manage meetings. To use the API, you need to:

1. Register an account
2. Upgrade to premium
3. Generate API keys in your profile

### Authentication

Include your API keys in the request headers:
\`\`\`
X-API-Key: your_api_key
X-API-Secret: your_api_secret
\`\`\`

### Endpoints

- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings` - Get all your meetings
- `GET /api/meetings/:roomCode` - Get meeting details
- `POST /api/meetings/:roomCode/end` - End a meeting

## Deployment

### Using Docker

1. Build the Docker image:
\`\`\`bash
docker build -t meetclone .
\`\`\`

2. Run the container:
\`\`\`bash
docker run -p 3000:3000 --env-file .env meetclone
\`\`\`

### On Heroku

\`\`\`bash
heroku create
git push heroku main
heroku config:set $(cat .env)
\`\`\`

## Troubleshooting

### Camera/Microphone Issues

If users can't access their camera or microphone:
1. Ensure they've granted permission in their browser
2. Check if the device is being used by another application
3. Try using a different browser

### WebRTC Connection Issues

If users can't connect to each other:
1. Ensure they're on a secure connection (HTTPS)
2. Check if their network allows WebRTC traffic
3. Try using a TURN server for NAT traversal

## License

This project is licensed under the MIT License - see the LICENSE file for details.
