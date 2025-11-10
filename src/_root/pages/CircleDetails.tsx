import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getCircleById, 
  joinCircle, 
  leaveCircle, 
  deleteCircle,
  getCirclePosts 
} from '@/lib/api/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/context/AuthContext';
import { MasonryGrid } from '@/components/shared';
import { Loader } from '@/components/shared';

const CircleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  
  const [circle, setCircle] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCircleDetails();
    }
  }, [id]);

  const fetchCircleDetails = async () => {
    setIsLoading(true);
    try {
      const [circleData, postsData] = await Promise.all([
        getCircleById(id!),
        getCirclePosts(id!)
      ]);
      setCircle(circleData);
      setPosts(postsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to fetch circle details',
        variant: 'destructive',
      });
      navigate('/circles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsActionLoading(true);
    try {
      await joinCircle(id!);
      toast({
        title: 'Joined! 🎉',
        description: `You're now a member of ${circle.name}`,
      });
      fetchCircleDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to join circle',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsActionLoading(true);
    try {
      await leaveCircle(id!);
      toast({
        title: 'Left circle',
        description: `You've left ${circle.name}`,
      });
      navigate('/circles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to leave circle',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this circle? This action cannot be undone.')) {
      return;
    }

    setIsActionLoading(true);
    try {
      await deleteCircle(id!);
      toast({
        title: 'Circle deleted',
        description: `${circle.name} has been deleted`,
      });
      navigate('/circles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to delete circle',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!circle) {
    return null;
  }

  const isCreator = circle.creator._id === user.id;
  const isMember = circle.isMember;
  const { hours, minutes } = circle.timeRemaining;
  const isExpiringSoon = hours < 3;

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <Button
          variant="ghost"
          onClick={() => navigate('/circles')}
          className="shad-button_ghost mb-6"
        >
          <img src="/assets/icons/back.svg" alt="back" width={20} height={20} />
          <p className="small-medium lg:base-medium ml-2">Back</p>
        </Button>

        <div className="post-card mb-8">
          <div className="flex-between mb-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex-center text-3xl lg:text-4xl"
                style={{ backgroundColor: `${circle.color}30` }}
              >
                {circle.icon}
              </div>
              
              <div>
                <h1 className="h3-bold lg:h2-bold">{circle.name}</h1>
                <p className="small-regular lg:base-regular text-light-3">{circle.topic}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isCreator ? (
                <>
                  <Link to={`/circles/${circle._id}/create-post`}>
                    <Button className="shad-button_primary">
                      <img src="/assets/icons/add-post.svg" alt="post" width={20} height={20} className="invert-white" />
                      <span className="hidden sm:inline ml-2">Post</span>
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className="shad-button_ghost"
                  >
                    <img src="/assets/icons/delete.svg" alt="delete" width={20} height={20} />
                  </Button>
                </>
              ) : isMember ? (
                <>
                  <Link to={`/circles/${circle._id}/create-post`}>
                    <Button className="shad-button_primary">
                      <img src="/assets/icons/add-post.svg" alt="post" width={20} height={20} className="invert-white" />
                      <span className="hidden sm:inline ml-2">Post</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLeave}
                    disabled={isActionLoading}
                    className="shad-button_dark_4"
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={isActionLoading}
                  className="shad-button_primary"
                >
                  Join Circle
                </Button>
              )}
            </div>
          </div>

          {circle.description && (
            <p className="small-medium lg:base-medium mb-4">{circle.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-light-3 small-regular">
            <div className="flex-center gap-2">
              <img src="/assets/icons/people.svg" alt="members" width={18} height={18} />
              <span>{circle.members.length} members</span>
            </div>
            <div className="flex-center gap-2">
              <img src="/assets/icons/gallery-add.svg" alt="posts" width={18} height={18} />
              <span>{circle.stats.totalPosts} posts</span>
            </div>
            <div className={`flex-center gap-2 ${isExpiringSoon ? 'text-red' : ''}`}>
              <img src="/assets/icons/clock.svg" alt="time" width={18} height={18} />
              <span>{hours > 0 ? `${hours}h ` : ''}{minutes}m left</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-4">
            <img 
              src={circle.creator.imageUrl} 
              alt={circle.creator.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="tiny-medium text-light-4">Created by</p>
              <Link 
                to={`/profile/${circle.creator._id}`}
                className="small-medium text-primary-500 hover:underline"
              >
                @{circle.creator.username}
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="h3-bold mb-6">Members ({circle.members.length})</h2>
          <ul className="user-grid">
            {circle.members.slice(0, 12).map((member: any) => (
              <li key={member._id}>
                <Link to={`/profile/${member._id}`} className="user-card">
                  <img 
                    src={member.imageUrl} 
                    alt={member.name}
                    className="rounded-full w-14 h-14"
                  />
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <p className="base-medium text-light-1 text-center line-clamp-1">{member.name}</p>
                    <p className="small-regular text-light-3 text-center line-clamp-1">@{member.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {circle.members.length > 12 && (
            <p className="text-center small-regular text-light-4 mt-4">
              +{circle.members.length - 12} more members
            </p>
          )}
        </div>

        <div>
          <h2 className="h3-bold mb-6">Posts ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="flex-center flex-col gap-4 py-20">
              <p className="body-medium text-light-2">No posts yet</p>
              <p className="small-regular text-light-4">
                Be the first to share something in this circle!
              </p>
              {isMember && (
                <Link to={`/circles/${circle._id}/create-post`} className="mt-4">
                  <Button className="shad-button_primary">
                    Create First Post
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <MasonryGrid posts={posts} showStats={true} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleDetails;
