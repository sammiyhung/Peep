/**
 * Peep Energy Management System
 * Handles energy regeneration, spending, and rewards
 */

const ENERGY_CONFIG = {
  MAX_ENERGY: 1000,
  REGEN_RATE: 1, // Energy per minute
  REGEN_INTERVAL: 60000, // 1 minute in milliseconds
  
  // Energy Costs
  COSTS: {
    CREATE_POST: 5,
    LIKE_POST: 1,
    COMMENT: 2,
    SHARE: 3,
    BOOST_POST: 20,
    CREATE_CHALLENGE: 30,
  },
  
  // Energy Rewards
  REWARDS: {
    POST_LIKED: 2,
    POST_COMMENTED: 3,
    POST_SHARED: 5,
    DAILY_LOGIN: 20,
    COMPLETE_PROFILE: 50,
    FIRST_POST: 30,
    STREAK_BONUS: 10, // Per day of streak
  },
};

/**
 * Regenerate energy based on time elapsed
 */
const regenerateEnergy = (user) => {
  const now = new Date();
  const lastUpdate = new Date(user.energyLastUpdated);
  const minutesElapsed = Math.floor((now - lastUpdate) / ENERGY_CONFIG.REGEN_INTERVAL);
  
  if (minutesElapsed > 0) {
    const energyToAdd = minutesElapsed * ENERGY_CONFIG.REGEN_RATE;
    const newEnergy = Math.min(user.energy + energyToAdd, ENERGY_CONFIG.MAX_ENERGY);
    
    return {
      energy: newEnergy,
      energyLastUpdated: now,
      regenerated: energyToAdd,
    };
  }
  
  return {
    energy: user.energy,
    energyLastUpdated: user.energyLastUpdated,
    regenerated: 0,
  };
};

/**
 * Check if user has enough energy
 */
const hasEnoughEnergy = (user, cost) => {
  return user.energy >= cost;
};

/**
 * Spend energy
 */
const spendEnergy = async (user, cost, action) => {
  if (!hasEnoughEnergy(user, cost)) {
    throw new Error(`Not enough energy. Need ${cost}, have ${user.energy}`);
  }
  
  user.energy -= cost;
  user.energyLastUpdated = new Date();
  
  // Track action for analytics
  console.log(`User ${user.username} spent ${cost} energy on ${action}`);
  
  return user;
};

/**
 * Award energy
 */
const awardEnergy = async (user, amount, reason) => {
  const newEnergy = Math.min(user.energy + amount, ENERGY_CONFIG.MAX_ENERGY);
  user.energy = newEnergy;
  user.energyLastUpdated = new Date();
  
  console.log(`User ${user.username} earned ${amount} energy for ${reason}`);
  
  return user;
};

/**
 * Calculate level from vibe score
 */
const calculateLevel = (vibeScore) => {
  return Math.floor(vibeScore / 100) + 1;
};

/**
 * Update streak
 */
const updateStreak = (user) => {
  const now = new Date();
  const lastActive = new Date(user.streak.lastActive);
  const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
  
  if (hoursSinceActive < 24) {
    // Same day, no change
    return user.streak;
  } else if (hoursSinceActive < 48) {
    // Next day, increment streak
    user.streak.current += 1;
    user.streak.longest = Math.max(user.streak.current, user.streak.longest);
    user.streak.lastActive = now;
    
    // Award streak bonus
    const bonus = ENERGY_CONFIG.REWARDS.STREAK_BONUS * user.streak.current;
    user.energy = Math.min(user.energy + bonus, ENERGY_CONFIG.MAX_ENERGY);
    
    return user.streak;
  } else {
    // Streak broken
    user.streak.current = 1;
    user.streak.lastActive = now;
    return user.streak;
  }
};

/**
 * Award badge
 */
const awardBadge = (user, badgeName, badgeIcon) => {
  const existingBadge = user.badges.find(b => b.name === badgeName);
  
  if (!existingBadge) {
    user.badges.push({
      name: badgeName,
      icon: badgeIcon,
      earnedAt: new Date(),
    });
    
    console.log(`User ${user.username} earned badge: ${badgeName}`);
  }
  
  return user;
};

module.exports = {
  ENERGY_CONFIG,
  regenerateEnergy,
  hasEnoughEnergy,
  spendEnergy,
  awardEnergy,
  calculateLevel,
  updateStreak,
  awardBadge,
};
