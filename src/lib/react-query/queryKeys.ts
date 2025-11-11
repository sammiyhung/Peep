export enum QUERY_KEYS {
  // AUTH KEYS
  CREATE_USER_ACCOUNT = "createUserAccount",

  // USER KEYS
  GET_CURRENT_USER = "getCurrentUser",
  GET_USERS = "getUsers",
  GET_USER_BY_ID = "getUserById",

  // POST KEYS
  GET_POSTS = "getPosts",
  GET_INFINITE_POSTS = "getInfinitePosts",
  GET_RECENT_POSTS = "getRecentPosts",
  GET_POST_BY_ID = "getPostById",
  GET_USER_POSTS = "getUserPosts",
  GET_FILE_PREVIEW = "getFilePreview",

  //  SEARCH KEYS
  SEARCH_POSTS = "getSearchPosts",

  // VIBE REQUEST KEYS
  GET_RECEIVED_VIBE_REQUESTS = "getReceivedVibeRequests",
  GET_SENT_VIBE_REQUESTS = "getSentVibeRequests",
  GET_VIBE_REQUEST_STATUS = "getVibeRequestStatus",

  // NOTIFICATION KEYS
  GET_NOTIFICATIONS = "getNotifications",
  GET_UNREAD_NOTIFICATIONS_COUNT = "getUnreadNotificationsCount",
  MARK_NOTIFICATION_AS_READ = "markNotificationAsRead",
  MARK_ALL_NOTIFICATIONS_AS_READ = "markAllNotificationsAsRead",
  DELETE_NOTIFICATION = "deleteNotification",
  CLEAR_ALL_NOTIFICATIONS = "clearAllNotifications",
  GET_NOTIFICATION_SETTINGS = "getNotificationSettings",
  UPDATE_NOTIFICATION_SETTINGS = "updateNotificationSettings",
  CHANGE_PASSWORD = "changePassword",
}
