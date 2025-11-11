import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '../ui/button';
import { followUser } from '@/lib/api/api';
import { useUserContext } from '@/context/AuthContext';
import { useToast } from '../ui/use-toast';
import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
import VibeButton from './VibeButton';

type UserCardProps = {
  user: any;
  onFollowChange?: () => void;
  isFollowingContext?: boolean; // True if this card is in the Following tab
};

const UserCard = ({ user, onFollowChange, isFollowingContext = false }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If in Following context, we know we're following this user
    if (isFollowingContext) {
      setIsFollowing(true);
    } else {
      // Check if current user is following this user
      setIsFollowing(user.followers?.includes(currentUser.id) || false);
    }
  }, [user.followers, currentUser.id, isFollowingContext]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const response = await followUser(user._id);
      setIsFollowing(response.isFollowing);
      
      // Update the user object to reflect the change
      if (response.isFollowing) {
        if (!user.followers) user.followers = [];
        if (!user.followers.includes(currentUser.id)) {
          user.followers.push(currentUser.id);
        }
      } else {
        if (user.followers) {
          user.followers = user.followers.filter((id: string) => id !== currentUser.id);
        }
      }
      
      toast({
        title: response.message,
      });
      
      // Invalidate queries to refetch data everywhere
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_CURRENT_USER] });
      
      // Trigger refetch if callback provided
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = currentUser.id === user._id;

  return (
    <div className="user-card flex flex-col items-center justify-center p-4 border rounded-lg shadow-md">
      {/* Profile Link */}
      <Link to={`/profile/${user._id}`} className="flex flex-col items-center justify-center">
        <img
          src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
          alt="user-profile"
          className="rounded-full w-14 h-14"
        />
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="base-medium text-light-1 text-center line-clamp-1">{user.name}</p>
          <p className="small-regular text-light-3 text-center line-clamp-1">@{user.username}</p>
        </div>
      </Link>

      {/* Action Buttons */}
      {!isOwnProfile && (
        <div className="flex gap-2 mt-3 w-full">
          <VibeButton
            userId={user._id}
            variant="default"
            size="sm"
            showLabel={true}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`px-3 flex-1 flex items-center justify-center gap-1 ${
              isFollowing 
                ? 'bg-dark-3 border-dark-3 hover:bg-dark-4 hover:text-white' 
                : 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
            }`}
            onClick={handleFollow}
            disabled={isLoading}
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4" />
                <span className="sm:inline">Unfollow</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="sm:inline">Follow</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserCard;
