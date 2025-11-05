/**
 * Trending Score Calculator
 * Calculates trending scores for posts based on engagement velocity
 */

/**
 * Enhanced Calculate trending score for a post
 * Higher score = more trending
 * Factors: velocity, recency, diversity, comments
 */
const calculateTrendingScore = (post) => {
  const now = new Date();
  const createdAt = new Date(post.createdAt);
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);
  
  // Engagement metrics with weights
  const likes = post.likes?.length || 0;
  const weightedReactions = getTotalReactions(post.reactions);
  const comments = post.commentsCount || 0;
  
  // Total engagement with comment boost (comments are more valuable)
  const totalEngagement = likes + weightedReactions + (comments * 3);
  
  // Enhanced time decay with different phases
  let timeDecay;
  if (ageInHours < 1) {
    // Super fresh posts get maximum boost
    timeDecay = 2.0;
  } else if (ageInHours < 6) {
    // Recent posts get strong boost
    timeDecay = Math.exp(-ageInHours / 12);
  } else if (ageInHours < 24) {
    // Day-old posts decay normally
    timeDecay = Math.exp(-ageInHours / 24);
  } else {
    // Older posts decay faster
    timeDecay = Math.exp(-ageInHours / 18);
  }
  
  // Engagement velocity (engagement per hour) with minimum threshold
  const velocity = ageInHours > 0 ? totalEngagement / Math.max(ageInHours, 0.5) : totalEngagement * 2;
  
  // Reaction diversity bonus (more types = more interesting)
  const diversityBonus = calculateReactionDiversity(post.reactions);
  
  // Comment engagement bonus
  const commentBonus = comments > 0 ? Math.log(comments + 1) * 20 : 0;
  
  // Mood popularity factor (some moods trend better)
  const moodMultiplier = getMoodMultiplier(post.mood);
  
  // Calculate final score with all factors
  const baseScore = velocity * 100 * timeDecay * moodMultiplier;
  const bonuses = diversityBonus + commentBonus;
  const score = baseScore + bonuses;
  
  return Math.round(Math.max(score, 0));
};

/**
 * Get mood multiplier for trending
 */
const getMoodMultiplier = (mood) => {
  const multipliers = {
    inspired: 1.3,
    creative: 1.2,
    energetic: 1.2,
    happy: 1.1,
    thoughtful: 1.0,
    focused: 1.0,
    chill: 0.9,
    relaxed: 0.9,
    neutral: 0.8,
  };
  return multipliers[mood] || 1.0;
};

/**
 * Get weighted reaction count
 * Different reactions have different weights in the algorithm
 */
const getTotalReactions = (reactions) => {
  if (!reactions) return 0;
  
  // Reaction weights (higher = more impact on trending)
  const weights = {
    mindBlown: 5,   // Most impactful
    realTalk: 5,    // Most impactful
    vibeCheck: 4,   // High impact
    fire: 3,        // Medium impact
    heart: 2,       // Lower impact (most common)
  };
  
  return (
    (reactions.mindBlown?.length || 0) * weights.mindBlown +
    (reactions.vibeCheck?.length || 0) * weights.vibeCheck +
    (reactions.realTalk?.length || 0) * weights.realTalk +
    (reactions.fire?.length || 0) * weights.fire +
    (reactions.heart?.length || 0) * weights.heart
  );
};

/**
 * Calculate reaction diversity bonus
 */
const calculateReactionDiversity = (reactions) => {
  if (!reactions) return 0;
  
  const types = [
    reactions.mindBlown?.length || 0,
    reactions.vibeCheck?.length || 0,
    reactions.realTalk?.length || 0,
    reactions.fire?.length || 0,
    reactions.heart?.length || 0,
  ];
  
  const nonZeroTypes = types.filter(count => count > 0).length;
  
  // More diverse reactions = higher bonus
  return nonZeroTypes * 10;
};

/**
 * Get trending posts
 */
const getTrendingPosts = async (posts, limit = 20) => {
  const postsWithScores = posts.map(post => ({
    ...post.toObject(),
    trendingScore: calculateTrendingScore(post),
  }));
  
  return postsWithScores
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
};

/**
 * Calculate trending wave height for visualization
 * Returns value from 0-100
 */
const calculateWaveHeight = (trendingScore) => {
  // Normalize score to 0-100 range
  const maxScore = 1000; // Assumed max trending score
  return Math.min((trendingScore / maxScore) * 100, 100);
};

/**
 * Get trending topics from posts
 */
const getTrendingTopics = (posts) => {
  const tagCounts = {};
  const now = new Date();
  
  posts.forEach(post => {
    const ageInHours = (now - new Date(post.createdAt)) / (1000 * 60 * 60);
    
    // Only consider recent posts (last 48 hours)
    if (ageInHours <= 48) {
      post.tags?.forEach(tag => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = {
            count: 0,
            engagement: 0,
          };
        }
        tagCounts[tag].count += 1;
        tagCounts[tag].engagement += (post.likes?.length || 0) + getTotalReactions(post.reactions);
      });
    }
  });
  
  // Convert to array and sort by engagement
  const trending = Object.entries(tagCounts)
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      engagement: data.engagement,
      score: data.count * data.engagement,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  return trending;
};

/**
 * Get mood-based trending
 */
const getMoodTrending = (posts, mood) => {
  const moodPosts = posts.filter(post => post.mood === mood);
  return getTrendingPosts(moodPosts, 10);
};

module.exports = {
  calculateTrendingScore,
  getTrendingPosts,
  calculateWaveHeight,
  getTrendingTopics,
  getMoodTrending,
};
