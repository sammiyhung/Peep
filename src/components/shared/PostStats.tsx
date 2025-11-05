import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Flame, Zap, ThumbsUp, Sparkles, Heart, MessageCircle } from "lucide-react";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "@/lib/react-query/queries";
import { addReaction, removeReaction, getComments } from "@/lib/api/api";
import { ReactionType } from "@/constants/reactions";

type PostStatsProps = {
  post: any;
  userId: string;
};

type PostReactions = {
  mindBlown: string[];
  vibeCheck: string[];
  realTalk: string[];
  fire: string[];
  heart: string[];
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const likesList = post.likes.map((user: any) => user._id || user);

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);
  const [reactions, setReactions] = useState<PostReactions>(post.reactions || {
    mindBlown: [],
    vibeCheck: [],
    realTalk: [],
    fire: [],
    heart: [],
  });
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();

  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save?.find(
    (record: any) => record.post._id === post._id
  );

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [currentUser]);

  useEffect(() => {
    // Fetch actual comments count
    const fetchCommentsCount = async () => {
      try {
        const comments = await getComments(post._id);
        setCommentCount(comments.length);
      } catch (error) {
        console.error('Error fetching comments count:', error);
        // Fallback to post data if available
        if (Array.isArray(post.comments)) {
          setCommentCount(post.comments.length);
        } else if (typeof post.commentCount === 'number') {
          setCommentCount(post.commentCount);
        }
      }
    };
    fetchCommentsCount();
  }, [post._id]);

  useEffect(() => {
    // Find user's current reaction
    if (reactions) {
      const reactionTypes: ReactionType[] = ['mindBlown', 'vibeCheck', 'realTalk', 'fire', 'heart'];
      for (const type of reactionTypes) {
        if (reactions[type]?.includes(userId)) {
          setCurrentReaction(type);
          return;
        }
      }
    }
    setCurrentReaction(null);
  }, [reactions, userId]);

  const navigate = useNavigate();

  const handleLikePost = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If user already liked, remove like
    if (checkIsLiked(likes, userId)) {
      const likesArray = likes.filter((Id) => Id !== userId);
      setLikes(likesArray);
      likePost({ postId: post._id, likesArray });
    } else {
      // Remove any existing reaction first
      if (currentReaction) {
        await removeReaction(post._id);
        const newReactions = { ...reactions };
        newReactions[currentReaction] = newReactions[currentReaction].filter(id => id !== userId);
        setReactions(newReactions);
        setCurrentReaction(null);
      }
      
      // Add like
      const likesArray = [...likes, userId];
      setLikes(likesArray);
      likePost({ postId: post._id, likesArray });
    }
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (savedPostRecord) {
      setIsSaved(false);
      return deleteSavePost(savedPostRecord._id);
    }

    savePost({ userId: userId, postId: post._id });
    setIsSaved(true);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    try {
      // If clicking same reaction, remove it
      if (currentReaction === reactionType) {
        await removeReaction(post._id);
        
        // Update local state
        const newReactions = { ...reactions };
        newReactions[reactionType] = newReactions[reactionType].filter(id => id !== userId);
        setReactions(newReactions);
        setCurrentReaction(null);
      } else {
        // Remove like if user has liked
        if (checkIsLiked(likes, userId)) {
          const likesArray = likes.filter((Id) => Id !== userId);
          setLikes(likesArray);
          likePost({ postId: post._id, likesArray });
        }
        
        // Add new reaction (this will remove any existing reaction)
        const response = await addReaction(post._id, reactionType);
        
        // Update local state
        setReactions(response.reactions);
        setCurrentReaction(reactionType);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/posts/${post._id}`);
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  const isLiked = checkIsLiked(likes, userId);

  return (
    <div className={`flex justify-evenly items-center z-20 gap-1 sm:gap-2 ${containerStyles}`}>
      {/* Heart/Like Reaction */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <Heart
          size={18}
          onClick={handleLikePost}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill={isLiked ? '#FF1744' : 'none'}
          stroke={isLiked ? '#FF1744' : 'currentColor'}
        />
        <p className="text-xs sm:small-medium">{likes.length}</p>
      </div>

      {/* Fire Reaction */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <Flame
          size={18}
          onClick={() => handleReaction('fire')}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill={currentReaction === 'fire' ? '#FF6B35' : 'none'}
          stroke={currentReaction === 'fire' ? '#FF6B35' : 'currentColor'}
        />
        <p className="text-xs sm:small-medium">{reactions.fire.length}</p>
      </div>

      {/* Mind Blown Reaction */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <Zap
          size={18}
          onClick={() => handleReaction('mindBlown')}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill={currentReaction === 'mindBlown' ? '#FFD700' : 'none'}
          stroke={currentReaction === 'mindBlown' ? '#FFD700' : 'currentColor'}
        />
        <p className="text-xs sm:small-medium">{reactions.mindBlown.length}</p>
      </div>

      {/* Vibe Check Reaction */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <Sparkles
          size={18}
          onClick={() => handleReaction('vibeCheck')}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill={currentReaction === 'vibeCheck' ? '#9D4EDD' : 'none'}
          stroke={currentReaction === 'vibeCheck' ? '#9D4EDD' : 'currentColor'}
        />
        <p className="text-xs sm:small-medium">{reactions.vibeCheck.length}</p>
      </div>

      {/* Real Talk Reaction */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <ThumbsUp
          size={18}
          onClick={() => handleReaction('realTalk')}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill={currentReaction === 'realTalk' ? '#06D6A0' : 'none'}
          stroke={currentReaction === 'realTalk' ? '#06D6A0' : 'currentColor'}
        />
        <p className="text-xs sm:small-medium">{reactions.realTalk.length}</p>
      </div>

      {/* Comments */}
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
        <MessageCircle
          size={18}
          onClick={handleCommentClick}
          className="cursor-pointer transition-all sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
        />
        <p className="text-xs sm:small-medium">{commentCount}</p>
      </div>

      {/* Save */}
      <div className="flex gap-1 items-center">
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="save"
          className="w-[18px] h-[18px] sm:w-5 sm:h-5 cursor-pointer"
          onClick={(e) => handleSavePost(e)}
        />
      </div>
    </div>
  );
};

export default PostStats;
