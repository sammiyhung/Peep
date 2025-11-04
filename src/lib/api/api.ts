import { api } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const response = await api.post('/api/auth/signup', user);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  } catch (error: any) {
    console.log(error);
    throw error.response?.data?.message || 'Error creating account';
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
    throw error.response?.data?.message || 'Error signing in';
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
    await api.post('/api/auth/signout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { status: 'success' };
  } catch (error) {
    console.log(error);
    throw error;
  }
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

// ============================== SAVE POST
export async function savePost(_userId: string, postId: string) {
  // userId is extracted from JWT token on backend, parameter kept for compatibility
  try {
    const response = await api.post(`/api/posts/${postId}/save`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

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
    
    if (user.file.length > 0) {
      formData.append('file', user.file[0]);
    }
    
    formData.append('name', user.name);
    formData.append('bio', user.bio);
    formData.append('imageUrl', user.imageUrl.toString());
    formData.append('imageId', user.imageId);

    const response = await api.put(`/api/users/${user.userId}`, formData, {
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
