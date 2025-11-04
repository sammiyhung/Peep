# Setup Checklist

## ✅ Completed (by migration)
- [x] Created MongoDB models (User, Post, Save, Message)
- [x] Created Express.js API server with routes
- [x] Implemented JWT authentication
- [x] Set up Cloudinary file storage
- [x] Updated frontend API layer
- [x] Updated Socket.io to use MongoDB
- [x] Created environment configuration files
- [x] Updated package.json dependencies

## 📋 Manual Steps Required

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Install Frontend Dependencies  
```bash
cd ..
npm install
```

### 3. Set Up MongoDB
Choose one:
- **Local**: Install MongoDB and run `mongod`
- **Cloud**: Create MongoDB Atlas cluster

### 4. Set Up Cloudinary
1. Sign up at https://cloudinary.com
2. Get your credentials from Dashboard
3. Update `server/.env` with:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

### 5. Configure Environment Variables

#### `server/.env`
- Set `MONGODB_URI` (your MongoDB connection string)
- Set `JWT_SECRET` (generate a random secure string)
- Set Cloudinary credentials
- Verify `PORT` and `FRONTEND_URL`

#### `.env` (frontend root)
- Set `VITE_API_URL` (default: http://localhost:10000)

### 6. Start Development Servers

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 7. Test the Application
1. Open http://localhost:5173
2. Try signing up a new user
3. Create a post with an image
4. Test all features

## 🔧 Optional: Remove Old Appwrite Files

After confirming everything works, you can delete:
- `src/lib/appwrite/` directory (old Appwrite config and API)

## 🚨 Important Notes

1. **Data Loss**: Your old Appwrite data is not automatically migrated. You'll need to recreate users and posts.

2. **Authentication**: All users need to sign up again since we're using a new auth system.

3. **Images**: Old image URLs from Appwrite won't work. New uploads will use Cloudinary.

4. **IDs**: MongoDB uses `_id` instead of Appwrite's `_id`. The code has been updated to handle this.

## 🐛 Common Issues

### "Cannot find module 'axios'"
Run `npm install` in the project root.

### "MongoDB connection failed"
Check your `MONGODB_URI` in `server/.env`.

### "Cloudinary upload error"
Verify your Cloudinary credentials in `server/.env`.

### "CORS error"
Ensure `FRONTEND_URL` in `server/.env` matches your frontend URL.

### "Token expired" or auth issues
Clear browser localStorage and sign in again.
