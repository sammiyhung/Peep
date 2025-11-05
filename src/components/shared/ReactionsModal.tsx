import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { REACTIONS, REACTION_ORDER, ReactionType } from '@/constants/reactions';
import { getPostReactions } from '@/lib/api/api';
import { Loader } from '@/components/shared';

type ReactionsModalProps = {
  reactions: {
    mindBlown: string[];
    vibeCheck: string[];
    realTalk: string[];
    fire: string[];
    heart: string[];
  };
  postId: string;
  onClose: () => void;
};

const ReactionsModal = ({ reactions, postId, onClose }: ReactionsModalProps) => {
  const [activeTab, setActiveTab] = useState<ReactionType | 'all'>('all');
  const [reactionsData, setReactionsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReactionsData();
  }, [postId]);

  const fetchReactionsData = async () => {
    try {
      const data = await getPostReactions(postId);
      setReactionsData(data);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reactionCounts = Object.entries(reactions).map(([type, users]) => ({
    type: type as ReactionType,
    count: users.length,
  }));

  const totalCount = reactionCounts.reduce((sum, r) => sum + r.count, 0);

  const getFilteredUsers = () => {
    if (!reactionsData) return [];
    
    if (activeTab === 'all') {
      return Object.values(reactionsData).flat();
    }
    
    return reactionsData[activeTab] || [];
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="fixed inset-0 z-50 flex-center bg-dark-1/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-dark-2 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-dark-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-between p-6 border-b border-dark-4">
          <h3 className="h3-bold">Reactions</h3>
          <button
            onClick={onClose}
            className="hover:bg-dark-4 p-2 rounded-lg transition-all"
          >
            <img src="/assets/icons/close.svg" alt="close" width={20} height={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-dark-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-4 text-light-3 hover:bg-dark-3'
            }`}
          >
            All {totalCount}
          </button>
          {REACTION_ORDER.map((type) => {
            const count = reactions[type]?.length || 0;
            if (count === 0) return null;

            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                }`}
              >
                <img
                  src={REACTIONS[type].icon}
                  alt={REACTIONS[type].label}
                  width={16}
                  height={16}
                />
                {count}
              </button>
            );
          })}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex-center py-10">
              <Loader />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex-center flex-col gap-2 py-10">
              <p className="body-medium text-light-3">No reactions yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredUsers.map((user: any) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-4 transition-all"
                >
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="base-medium text-light-1">{user.name}</p>
                    <p className="small-regular text-light-3">@{user.username}</p>
                  </div>
                  {user.reactionType && (
                    <img
                      src={REACTIONS[user.reactionType as ReactionType].icon}
                      alt={REACTIONS[user.reactionType as ReactionType].label}
                      width={20}
                      height={20}
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionsModal;
