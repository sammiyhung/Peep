import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import {
  createUserAccount,
  signInAccount,
  getCurrentUser,
  signOutAccount,
  getUsers,
  createPost,
  getPostById,
  updatePost,
  getUserPosts,
  deletePost,
  likePost,
  getUserById,
  updateUser,
  getRecentPosts,
  getInfinitePosts,
  searchPosts,
  savePost,
  deleteSavedPost,
  sendVibeRequest,
  acceptVibeRequest,
  rejectVibeRequest,
  cancelVibeRequest,
  getReceivedVibeRequests,
  getSentVibeRequests,
  getVibeRequestStatus,
  removePeep,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/api/api";
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";

// ============================================================
// AUTH QUERIES
// ============================================================

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};

// ============================================================
// POST QUERIES
// ============================================================

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: getInfinitePosts as any,
    getNextPageParam: (lastPage: any) => {
      // If there's no data, there are no more pages.
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the _id of the last document as the cursor.
      const lastId = lastPage.documents[lastPage.documents.length - 1]._id;
      return lastId;
    },
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?._id],
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, imageId }: { postId?: string; imageId: string }) =>
      deletePost(postId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      likesArray,
    }: {
      postId: string;
      likesArray: string[];
    }) => likePost(postId, likesArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?._id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, postId }: { userId: string; postId: string }) =>
      savePost(userId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

// ============================================================
// USER QUERIES
// ============================================================

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: IUpdateUser) => updateUser(user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?._id],
      });
    },
  });
};

// ============================================================
// VIBE REQUESTS QUERIES
// ============================================================

export const useSendVibeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      sendVibeRequest(receiverId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SENT_VIBE_REQUESTS],
      });
    },
  });
};

export const useAcceptVibeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => acceptVibeRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECEIVED_VIBE_REQUESTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useRejectVibeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rejectVibeRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECEIVED_VIBE_REQUESTS],
      });
    },
  });
};

export const useCancelVibeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => cancelVibeRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SENT_VIBE_REQUESTS],
      });
    },
  });
};

export const useGetReceivedVibeRequests = (status?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECEIVED_VIBE_REQUESTS, status],
    queryFn: () => getReceivedVibeRequests(status),
  });
};

export const useGetSentVibeRequests = (status?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SENT_VIBE_REQUESTS, status],
    queryFn: () => getSentVibeRequests(status),
  });
};

export const useGetVibeRequestStatus = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_VIBE_REQUEST_STATUS, userId],
    queryFn: () => getVibeRequestStatus(userId),
    enabled: !!userId,
  });
};

export const useRemovePeep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removePeep(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

// ============================================================
// NOTIFICATIONS QUERIES
// ============================================================

export const useGetNotifications = (limit = 50, skip = 0, unreadOnly = false) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, limit, skip, unreadOnly],
    queryFn: () => getNotifications(limit, skip, unreadOnly),
  });
};

export const useGetUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_UNREAD_NOTIFICATIONS_COUNT],
    queryFn: getUnreadNotificationsCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_NOTIFICATIONS_COUNT],
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_NOTIFICATIONS_COUNT],
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_NOTIFICATIONS_COUNT],
      });
    },
  });
};

export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_NOTIFICATIONS_COUNT],
      });
    },
  });
};

// ============================================================
// SETTINGS QUERIES
// ============================================================

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
  });
};

export const useGetNotificationSettings = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_NOTIFICATION_SETTINGS],
    queryFn: getNotificationSettings,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATION_SETTINGS],
      });
    },
  });
};
