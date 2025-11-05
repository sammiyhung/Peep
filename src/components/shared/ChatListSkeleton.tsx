const ChatListSkeleton = () => {
  return (
    <div className="glass-card p-4 rounded-xl animate-pulse flex items-center gap-3">
      <div className="w-12 h-12 bg-dark-4 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-dark-4 rounded w-32 mb-2"></div>
        <div className="h-3 bg-dark-4 rounded w-48"></div>
      </div>
      <div className="h-3 bg-dark-4 rounded w-12"></div>
    </div>
  );
};

export default ChatListSkeleton;
