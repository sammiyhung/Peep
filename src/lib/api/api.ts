import { api } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const response = await api.post('/api/auth/signup', user);
    
    // New flow: signup returns email and emailVerificationRequired
    // No token is provided until email is verified
    if (response.data.token) {
      // Legacy flow (if token is provided)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    // New flow: return the response data (includes email and emailVerificationRequired)
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error;
  }
}

// ============================== SAVE USER TO DB (handled in signup)
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  // This is now handled in the signup endpoint
  return user;
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const response = await api.post('/api/auth/signin', user);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.log(error);
    // Throw the entire error object so we can check status codes
    throw error;
  }
}

// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const response = await api.get('/api/auth/current');
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const response = await api.get('/api/auth/current');
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  try {
    // Try to call the signout endpoint, but don't fail if it errors
    await api.post('/api/auth/signout');
  } catch (error) {
    // Ignore server errors during signout - we'll clear local storage anyway
    console.log('Signout API call failed (this is okay):', error);
  }
  
  // Always clear local storage regardless of API call success
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pendingVerificationEmail');
  
  return { status: 'success' };
}

// ============================================================
// POSTS
// ============================================================

// ============================== CREATE POST
export async function createPost(post: INewPost) {
  try {
    const formData = new FormData();
    formData.append('file', post.file[0]);
    formData.append('caption', post.caption);
    formData.append('location', post.location || '');
    formData.append('tags', post.tags || '');
    formData.append('mood', post.mood || 'neutral');
    
    // Add circleId if posting to a circle
    if (post.circleId) {
      formData.append('circleId', post.circleId);
    }

    const response = await api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== UPLOAD FILE (handled in createPost)
export async function uploadFile(_file: File) {
  // File upload is now handled within createPost and updatePost
  // Parameter prefixed with _ to indicate it's intentionally unused
  return { _id: 'temp_id' };
}

// ============================== GET FILE URL (handled by backend)
export function getFilePreview(fileId: string) {
  // URLs are now returned directly from the backend
  // This function is kept for compatibility with existing code
  return fileId;
}

// ============================== DELETE FILE (handled by backend)
export async function deleteFile(_fileId: string) {
  // File deletion is now handled by the backend when deleting posts
  // Parameter prefixed with _ to indicate it's intentionally unused
  return { status: "ok" };
}

// ============================== SEARCH POSTS
export async function searchPosts(searchTerm: string) {
  try {
    const response = await api.get(`/api/posts/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET INFINITE POSTS
export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  try {
    const response = await api.get('/api/posts', {
      params: {
        cursor: pageParam || undefined,
        limit: 9,
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error('Post ID is required');

  try {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== UPDATE POST
export async function updatePost(post: IUpdatePost) {
  try {
    const formData = new FormData();
    
    if (post.file.length > 0) {
      formData.append('file', post.file[0]);
    }
    
    formData.append('caption', post.caption);
    formData.append('location', post.location || '');
    formData.append('tags', post.tags || '');
    formData.append('imageUrl', post.imageUrl.toString());
    formData.append('imageId', post.imageId);

    const response = await api.put(`/api/posts/${post.postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== DELETE POST
export async function deletePost(postId?: string, _imageId?: string) {
  if (!postId) return;
  // imageId parameter kept for compatibility but not used (backend handles deletion)

  try {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== LIKE / UNLIKE POST
export async function likePost(postId: string, likesArray: string[]) {
  try {
    const response = await api.put(`/api/posts/${postId}/like`, { likesArray });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== SAVE POST (moved to user endpoint below)

// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId: string) {
  try {
    const response = await api.delete(`/api/posts/save/${savedRecordId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    const response = await api.get(`/api/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET RECENT POSTS
export async function getRecentPosts() {
  try {
    const response = await api.get('/api/posts/recent');
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: number) {
  try {
    const response = await api.get('/api/users', {
      params: { limit },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== GET USER BY ID
export async function getUserById(userId: string) {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== UPDATE USER
export async function updateUser(user: IUpdateUser) {
  try {
    const formData = new FormData();
    formData.append('name', user.name);
    formData.append('bio', user.bio);
    formData.append('imageUrl', user.imageUrl);
    formData.append('imageId', user.imageId);
    
    if (user.username) {
      formData.append('username', user.username);
    }
    
    if (user.currentMood) {
      formData.append('currentMood', user.currentMood);
    }

    if (user.aboutMe !== undefined) {
      formData.append('aboutMe', user.aboutMe);
    }

    // Personal Information
    if (user.dateOfBirth !== undefined) {
      formData.append('dateOfBirth', user.dateOfBirth);
    }
    if (user.gender !== undefined) {
      formData.append('gender', user.gender);
    }
    if (user.location !== undefined) {
      formData.append('location', user.location);
    }
    if (user.website !== undefined) {
      formData.append('website', user.website);
    }
    if (user.phone !== undefined) {
      formData.append('phone', user.phone);
    }

    // Professional Information
    if (user.occupation !== undefined) {
      formData.append('occupation', user.occupation);
    }
    if (user.company !== undefined) {
      formData.append('company', user.company);
    }
    if (user.skills !== undefined) {
      formData.append('skills', user.skills);
    }
    if (user.interests !== undefined) {
      formData.append('interests', user.interests);
    }

    // Privacy Settings
    formData.append('showEmail', String(user.showEmail ?? false));
    formData.append('showPhone', String(user.showPhone ?? false));
    formData.append('showLocation', String(user.showLocation ?? true));
    formData.append('showDateOfBirth', String(user.showDateOfBirth ?? false));
    
    if (user.file.length > 0) {
      formData.append('file', user.file[0]);
    }

    const response = await api.put(`/api/users/${user.userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('updateUser API error:', error);
    throw error;
  }
}

// ============================== SAVED POSTS
export async function savePost(userId: string, postId: string) {
  try {
    const response = await api.post(`/api/users/${userId}/save-post`, { postId });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getSavedPosts(userId: string) {
  try {
    const response = await api.get(`/api/users/${userId}/saved-posts`);
    return response.data.posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== COFFEE CHAT & COLLABORATION
export async function requestCoffeeChat(userId: string, scheduledAt?: Date) {
  try {
    const response = await api.post(`/api/users/${userId}/coffee-chat`, { scheduledAt });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function sendCollaborationRequest(userId: string, project: string, message: string) {
  try {
    const response = await api.post(`/api/users/${userId}/collaborate`, { project, message });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== PEEP ENERGY & AUTHENTICITY
export async function updateEnergy(userId: string, amount: number, reason: string) {
  try {
    const response = await api.post(`/api/users/${userId}/update-energy`, { amount, reason });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function calculateAuthenticityScore(userId: string) {
  try {
    const response = await api.post(`/api/users/${userId}/calculate-authenticity`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================== FOLLOW SYSTEM
export async function followUser(userId: string) {
  try {
    const response = await api.post(`/api/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getFollowers(userId: string) {
  try {
    const response = await api.get(`/api/users/${userId}/followers`);
    return response.data.followers;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getFollowing(userId: string) {
  try {
    const response = await api.get(`/api/users/${userId}/following`);
    return response.data.following;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// CIRCLES
// ============================================================

// ============================== CREATE CIRCLE
export async function createCircle(circle: {
  name: string;
  topic: string;
  description?: string;
  icon?: string;
  color?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  tags?: string[];
  duration?: number;
}) {
  try {
    const response = await api.post('/api/circles', circle);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error creating circle';
  }
}

// ============================== GET ALL CIRCLES
export async function getCircles(params?: {
  search?: string;
  topic?: string;
  limit?: number;
}) {
  try {
    const response = await api.get('/api/circles', { params });
    return response.data.circles;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching circles';
  }
}

// ============================== GET MY CIRCLES
export async function getMyCircles() {
  try {
    const response = await api.get('/api/circles/my-circles');
    return response.data.circles;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching your circles';
  }
}

// ============================== GET CIRCLE BY ID
export async function getCircleById(circleId: string) {
  try {
    const response = await api.get(`/api/circles/${circleId}`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching circle';
  }
}

// ============================== JOIN CIRCLE
export async function joinCircle(circleId: string) {
  try {
    const response = await api.post(`/api/circles/${circleId}/join`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error joining circle';
  }
}

// ============================== LEAVE CIRCLE
export async function leaveCircle(circleId: string) {
  try {
    const response = await api.post(`/api/circles/${circleId}/leave`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error leaving circle';
  }
}

// ============================== DELETE CIRCLE
export async function deleteCircle(circleId: string) {
  try {
    const response = await api.delete(`/api/circles/${circleId}`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error deleting circle';
  }
}

// ============================== GET CIRCLE POSTS
export async function getCirclePosts(circleId: string) {
  try {
    const response = await api.get(`/api/circles/${circleId}/posts`);
    return response.data.posts;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching circle posts';
  }
}

// ============================================================
// REACTIONS
// ============================================================

// ============================== ADD REACTION
export async function addReaction(postId: string, reactionType: string) {
  try {
    const response = await api.post(`/api/posts/${postId}/react`, { reactionType });
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error adding reaction';
  }
}

// ============================== REMOVE REACTION
export async function removeReaction(postId: string) {
  try {
    const response = await api.delete(`/api/posts/${postId}/react`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error removing reaction';
  }
}

// ============================== GET POST REACTIONS
export async function getPostReactions(postId: string) {
  try {
    const response = await api.get(`/api/posts/${postId}/reactions`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching reactions';
  }
}

// ============================================================
// COMMENTS
// ============================================================

// ============================== CREATE COMMENT
export async function createComment(postId: string, text: string) {
  try {
    const response = await api.post('/api/comments', { postId, text });
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error creating comment';
  }
}

// ============================== GET COMMENTS
export async function getComments(postId: string) {
  try {
    const response = await api.get(`/api/comments/${postId}`);
    return response.data.comments;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error fetching comments';
  }
}

// ============================== DELETE COMMENT
export async function deleteComment(commentId: string) {
  try {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error deleting comment';
  }
}
