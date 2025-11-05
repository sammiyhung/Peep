const GridPostSkeleton = () => {
  return (
    <div className="relative min-w-80 h-80 animate-pulse">
      <div className="h-full w-full bg-dark-4 rounded-[24px]"></div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="h-4 bg-dark-3 rounded w-3/4 mb-2"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dark-3 rounded-full"></div>
          <div className="h-3 bg-dark-3 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default GridPostSkeleton;
