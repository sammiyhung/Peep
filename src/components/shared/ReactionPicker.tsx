import { useState } from 'react';
import { REACTIONS, REACTION_ORDER, ReactionType } from '@/constants/reactions';

type ReactionPickerProps = {
  onReact: (reactionType: ReactionType) => void;
  currentReaction?: ReactionType | null;
};

const ReactionPicker = ({ onReact, currentReaction }: ReactionPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (type: ReactionType) => {
    onReact(type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex-center gap-2 p-2 rounded-lg hover:bg-dark-4 transition-all"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setTimeout(() => setIsOpen(false), 200)}
      >
        {currentReaction ? (
          <img
            src={REACTIONS[currentReaction].icon}
            alt={REACTIONS[currentReaction].label}
            width={20}
            height={20}
            className="transition-transform hover:scale-110"
          />
        ) : (
          <img
            src="/assets/icons/like.svg"
            alt="React"
            width={20}
            height={20}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 flex gap-2 bg-dark-2 rounded-full px-3 py-2 shadow-xl border border-dark-4 z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {REACTION_ORDER.map((type) => {
            const reaction = REACTIONS[type];
            const isActive = currentReaction === type;
            
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`relative group transition-all duration-200 ${
                  isActive ? 'scale-125' : 'hover:scale-125'
                }`}
                title={reaction.label}
              >
                <img
                  src={reaction.icon}
                  alt={reaction.label}
                  width={24}
                  height={24}
                  className="transition-all"
                />
                
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {reaction.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
