import { useState } from 'react';
import { REACTIONS, ReactionType } from '@/constants/reactions';
import ReactionsModal from '@/components/shared/ReactionsModal';

type ReactionsSummaryProps = {
  reactions: {
    mindBlown: string[];
    vibeCheck: string[];
    realTalk: string[];
    fire: string[];
    heart: string[];
  };
  postId: string;
};

const ReactionsSummary = ({ reactions, postId }: ReactionsSummaryProps) => {
  const [showModal, setShowModal] = useState(false);

  // Get reactions with counts, sorted by count
  const reactionCounts = Object.entries(reactions)
    .map(([type, users]) => ({
      type: type as ReactionType,
      count: users.length,
      users,
    }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalReactions = reactionCounts.reduce((sum, r) => sum + r.count, 0);

  if (totalReactions === 0) return null;

  // Show top 3 reactions
  const topReactions = reactionCounts.slice(0, 3);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 hover:bg-dark-4 px-2 py-1 rounded-lg transition-all group"
      >
        <div className="flex -space-x-1">
          {topReactions.map((reaction) => (
            <div
              key={reaction.type}
              className="w-5 h-5 rounded-full bg-dark-2 border border-dark-4 flex-center group-hover:scale-110 transition-transform"
            >
              <img
                src={REACTIONS[reaction.type].icon}
                alt={REACTIONS[reaction.type].label}
                width={14}
                height={14}
              />
            </div>
          ))}
        </div>
        <span className="small-regular text-light-3 group-hover:text-light-1">
          {totalReactions}
        </span>
      </button>

      {showModal && (
        <ReactionsModal
          reactions={reactions}
          postId={postId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ReactionsSummary;
