/**
 * Vibe Match Score Calculator
 * Calculates compatibility between users based on various factors
 */

/**
 * Calculate vibe match score between two users
 * Returns a score from 0-100
 */
const calculateVibeMatch = (user1, user2) => {
  let score = 0;
  
  // 1. Interest Overlap (30 points)
  const interestScore = calculateInterestOverlap(user1.interests || [], user2.interests || []);
  score += interestScore * 0.3;
  
  // 2. Mood Compatibility (20 points)
  const moodScore = calculateMoodCompatibility(user1.currentMood, user2.currentMood);
  score += moodScore * 0.2;
  
  // 3. Activity Level Match (15 points)
  const activityScore = calculateActivityMatch(user1, user2);
  score += activityScore * 0.15;
  
  // 4. Content Style Similarity (20 points)
  const styleScore = calculateStyleSimilarity(user1, user2);
  score += styleScore * 0.2;
  
  // 5. Engagement Pattern (15 points)
  const engagementScore = calculateEngagementPattern(user1, user2);
  score += engagementScore * 0.15;
  
  return Math.round(score);
};

/**
 * Calculate interest overlap
 */
const calculateInterestOverlap = (interests1, interests2) => {
  if (interests1.length === 0 || interests2.length === 0) return 0;
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity
  return (intersection.size / union.size) * 100;
};

/**
 * Calculate mood compatibility
 */
const calculateMoodCompatibility = (mood1, mood2) => {
  const moodGroups = {
    energetic: ['happy', 'energetic', 'inspired'],
    calm: ['chill', 'relaxed', 'thoughtful'],
    productive: ['focused', 'creative'],
    neutral: ['neutral'],
  };
  
  // Find which group each mood belongs to
  let group1 = 'neutral';
  let group2 = 'neutral';
  
  for (const [group, moods] of Object.entries(moodGroups)) {
    if (moods.includes(mood1)) group1 = group;
    if (moods.includes(mood2)) group2 = group;
  }
  
  // Same group = high compatibility
  if (group1 === group2) return 100;
  
  // Compatible groups
  const compatible = {
    energetic: ['productive'],
    calm: ['productive'],
    productive: ['energetic', 'calm'],
  };
  
  if (compatible[group1]?.includes(group2)) return 70;
  
  return 40; // Different but not incompatible
};

/**
 * Calculate activity level match
 */
const calculateActivityMatch = (user1, user2) => {
  const level1 = user1.level || 1;
  const level2 = user2.level || 1;
  
  const diff = Math.abs(level1 - level2);
  
  // Closer levels = better match
  if (diff === 0) return 100;
  if (diff <= 2) return 80;
  if (diff <= 5) return 60;
  if (diff <= 10) return 40;
  return 20;
};

/**
 * Calculate content style similarity
 * Based on posting patterns, caption length, etc.
 */
const calculateStyleSimilarity = (user1, user2) => {
  // This would analyze actual posting patterns
  // For now, return a baseline score
  return 50;
};

/**
 * Calculate engagement pattern similarity
 */
const calculateEngagementPattern = (user1, user2) => {
  const streak1 = user1.streak?.current || 0;
  const streak2 = user2.streak?.current || 0;
  
  const diff = Math.abs(streak1 - streak2);
  
  // Similar streaks = similar engagement
  if (diff === 0) return 100;
  if (diff <= 3) return 80;
  if (diff <= 7) return 60;
  return 40;
};

/**
 * Find top vibe matches for a user
 */
const findTopVibeMatches = async (currentUser, allUsers, limit = 10) => {
  const matches = allUsers
    .filter(user => user._id.toString() !== currentUser._id.toString())
    .map(user => ({
      user,
      score: calculateVibeMatch(currentUser, user),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return matches;
};

/**
 * Get vibe match label
 */
const getVibeMatchLabel = (score) => {
  if (score >= 90) return '🔥 Soul Vibes';
  if (score >= 75) return '✨ Great Match';
  if (score >= 60) return '💫 Good Vibes';
  if (score >= 40) return '👋 Worth Exploring';
  return '🌱 Different Vibes';
};

module.exports = {
  calculateVibeMatch,
  findTopVibeMatches,
  getVibeMatchLabel,
};
