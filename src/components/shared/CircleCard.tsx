import { Link } from 'react-router-dom';

type CircleCardProps = {
  circle: {
    _id: string;
    name: string;
    topic: string;
    description: string;
    icon: string;
    color: string;
    creator: {
      _id: string;
      name: string;
      username: string;
      imageUrl: string;
    };
    members: any[];
    stats: {
      totalPosts: number;
    };
    timeRemaining: {
      hours: number;
      minutes: number;
    };
  };
};

const CircleCard = ({ circle }: CircleCardProps) => {
  const { hours, minutes } = circle.timeRemaining;
  const isExpiringSoon = hours < 3;

  return (
    <Link to={`/circles/${circle._id}`} className="user-card">
      <div className="flex-between w-full mb-3">
        <div 
          className="w-12 h-12 rounded-full flex-center text-2xl"
          style={{ backgroundColor: `${circle.color}30` }}
        >
          {circle.icon}
        </div>
        <div className={`subtle-semibold ${isExpiringSoon ? 'text-red' : 'text-light-3'}`}>
          {hours > 0 ? `${hours}h ` : ''}{minutes}m
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 w-full">
        <p className="base-medium text-light-1 text-center line-clamp-1">{circle.name}</p>
        <p className="small-regular text-light-3 text-center line-clamp-1">{circle.topic}</p>
      </div>

      {circle.description && (
        <p className="subtle-semibold text-light-3 text-center line-clamp-2 mt-2">
          {circle.description}
        </p>
      )}

      <div className="flex-center gap-4 mt-3 w-full text-light-3">
        <div className="flex-center gap-1">
          <img src="/assets/icons/people.svg" alt="members" width={16} height={16} />
          <span className="small-regular">{circle.members.length}</span>
        </div>
        <div className="flex-center gap-1">
          <img src="/assets/icons/gallery-add.svg" alt="posts" width={16} height={16} />
          <span className="small-regular">{circle.stats.totalPosts}</span>
        </div>
      </div>

      <div className="flex-center gap-2 mt-3 pt-3 border-t border-dark-4 w-full">
        <img 
          src={circle.creator.imageUrl} 
          alt={circle.creator.name}
          className="w-5 h-5 rounded-full"
        />
        <span className="tiny-medium text-light-4">@{circle.creator.username}</span>
      </div>
    </Link>
  );
};

export default CircleCard;
