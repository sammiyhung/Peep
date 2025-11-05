const Circle = require('../models/Circle');

/**
 * Cleanup job to expire old circles
 * Runs periodically to mark circles as expired when they pass their expiration time
 */
const cleanupExpiredCircles = async () => {
  try {
    const result = await Circle.expireOldCircles();
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Expired ${result.modifiedCount} circle(s)`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up expired circles:', error);
    throw error;
  }
};

/**
 * Start the cleanup job
 * Runs every 5 minutes
 */
const startCircleCleanupJob = () => {
  // Run immediately on startup
  cleanupExpiredCircles();
  
  // Run every 5 minutes (300000 ms)
  const interval = setInterval(cleanupExpiredCircles, 5 * 60 * 1000);
  
  console.log('🔄 Circle cleanup job started (runs every 5 minutes)');
  
  return interval;
};

module.exports = {
  cleanupExpiredCircles,
  startCircleCleanupJob,
};
