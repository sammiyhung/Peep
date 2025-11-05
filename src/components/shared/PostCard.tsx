import { Link } from "react-router-dom";
import { Smile, Sparkles, Wind, Target, Palette, Brain, Zap, Waves, Minus } from 'lucide-react';

import { PostStats } from "@/components/shared";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";

type PostCardProps = {
  post: any;
};

const MOODS: Record<string, { label: string; icon: any; color: string }> = {
  happy: { label: 'Happy', icon: Smile, color: 'text-yellow-500' },
  inspired: { label: 'Inspired', icon: Sparkles, color: 'text-purple-500' },
  chill: { label: 'Chill', icon: Wind, color: 'text-blue-500' },
  focused: { label: 'Focused', icon: Target, color: 'text-green-500' },
  creative: { label: 'Creative', icon: Palette, color: 'text-pink-500' },
  thoughtful: { label: 'Thoughtful', icon: Brain, color: 'text-indigo-500' },
  energetic: { label: 'Energetic', icon: Zap, color: 'text-red-500' },
  relaxed: { label: 'Relaxed', icon: Waves, color: 'text-teal-500' },
  neutral: { label: 'Neutral', icon: Minus, color: 'text-gray-500' },
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();

  if (!post.creator) return;

  const mood = post.mood || 'neutral';
  const MoodIcon = MOODS[mood]?.icon || Minus;
  const moodColor = MOODS[mood]?.color || 'text-gray-500';
  const moodLabel = MOODS[mood]?.label || 'Neutral';

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator._id}`}>
            <img
              src={
                post.creator?.imageUrl ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="w-12 lg:h-12 rounded-full"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post.createdAt)}
              </p>
              •
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post._id}`}
          className={`${user.id !== post.creator._id && "hidden"}`}>
          <img
            src={"/assets/icons/edit.svg"}
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post._id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`} className="text-light-3 small-regular">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        <img
          src={post.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="post image"
          className="post-card_img"
        />
      </Link>

      {/* Mood Display */}
      {mood && mood !== 'neutral' && (
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <MoodIcon size={18} className={moodColor} />
          <span className="small-medium text-light-2">{moodLabel}</span>
        </div>
      )}

      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
