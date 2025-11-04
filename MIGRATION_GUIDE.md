# Migration Guide: Appwrite to MongoDB

This guide will help you complete the migration from Appwrite to MongoDB.

## What Has Changed

### Backend
- **Database**: Appwrite → MongoDB
- **Authentication**: Appwrite Auth → JWT tokens with bcrypt
- **File Storage**: Appwrite Storage → Cloudinary
- **Server**: New Express.js REST API with Socket.io

### Frontend
- **API Client**: Appwrite SDK → Axios
- **Authentication**: Cookie-based → JWT token in localStorage
- **ID Fields**: `_id` → `_id` (MongoDB convention)

## Setup Instructions

### 1. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ..
npm install
```

### 2. Set Up MongoDB

You have two options:

#### Option A: Local MongoDB
1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Your connection string will be: `mongodb://localhost:27017/peep`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/peep`)
4. Whitelist your IP address in Atlas

### 3. Set Up Cloudinary

1. Create a free account at https://cloudinary.com/
2. Go to your Dashboard
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 4. Configure Environment Variables

#### Backend (`server/.env`)
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/peep
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/peep

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_secure_random_string_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=10000
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`.env`)
```env
# Backend API URL
VITE_API_URL=http://localhost:10000
```

### 5. Start the Servers

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/current` - Get current user
- `POST /api/auth/signout` - Logout user

### Posts
- `POST /api/posts` - Create post (with file upload)
- `GET /api/posts` - Get posts with pagination
- `GET /api/posts/recent` - Get recent posts
- `GET /api/posts/search?q=term` - Search posts
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `PUT /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/save` - Save post
- `DELETE /api/posts/save/:saveId` - Delete saved post
- `GET /api/posts/user/:userId` - Get user's posts

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

## Key Differences to Note

### 1. Document IDs
- **Before**: `post._id`, `user._id`
- **After**: `post._id`, `user._id`

### 2. Authentication
- **Before**: Appwrite session cookies
- **After**: JWT token in `Authorization: Bearer <token>` header

### 3. File Uploads
- **Before**: Appwrite Storage with `storage.createFile()`
- **After**: Cloudinary with multipart/form-data

### 4. Timestamps
- **Before**: `createdAt`, `$updatedAt`
- **After**: `createdAt`, `updatedAt` (automatically added by Mongoose)

### 5. Queries
- **Before**: Appwrite Query helpers
- **After**: MongoDB queries through API endpoints

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string format
- For Atlas: Verify IP whitelist and credentials

### Cloudinary Upload Errors
- Verify credentials in `.env`
- Check file size limits (default: 10MB)
- Ensure proper multipart/form-data encoding

### CORS Errors
- Verify `FRONTEND_URL` in server `.env`
- Check that both servers are running

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET is set
- Verify token in browser DevTools → Application → Local Storage

## Data Migration

If you need to migrate existing data from Appwrite:

1. Export data from Appwrite console
2. Transform the data format (mainly ID fields)
3. Import into MongoDB using `mongoimport` or a custom script

## Production Deployment

### Backend
1. Set strong `JWT_SECRET`
2. Use MongoDB Atlas for database
3. Set proper `FRONTEND_URL` for CORS
4. Deploy to Heroku, Railway, or similar

### Frontend
1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist` folder to Vercel, Netlify, or similar

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check MongoDB connection
5. Verify Cloudinary credentials
