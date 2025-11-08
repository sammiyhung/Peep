const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (simplified for migration)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Migration function
const migrateExistingUsers = async () => {
  try {
    console.log('\n🔄 Starting migration...\n');

    // Find all users where isEmailVerified is false or undefined
    const usersToUpdate = await User.find({
      $or: [
        { isEmailVerified: { $exists: false } },
        { isEmailVerified: false }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ All users are already verified!');
      return;
    }

    // Update all existing users to verified
    const result = await User.updateMany(
      {
        $or: [
          { isEmailVerified: { $exists: false } },
          { isEmailVerified: false }
        ]
      },
      {
        $set: { isEmailVerified: true }
      }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📈 Updated ${result.modifiedCount} users\n`);

    // Show sample of updated users
    const updatedUsers = await User.find({ isEmailVerified: true }).limit(5);
    console.log('📋 Sample of verified users:');
    updatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Verified: ${user.isEmailVerified}`);
    });

    console.log('\n✨ All existing users are now verified!\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateExistingUsers();
    
    console.log('🎉 Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Execute
runMigration();
