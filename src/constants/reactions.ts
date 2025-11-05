export type ReactionType = 'mindBlown' | 'vibeCheck' | 'realTalk' | 'fire' | 'heart';

export interface Reaction {
  type: ReactionType;
  label: string;
  icon: string;
  weight: number; // Algorithm weight
  color: string;
}

export const REACTIONS: Record<ReactionType, Reaction> = {
  mindBlown: {
    type: 'mindBlown',
    label: 'Mind Blown',
    icon: '/assets/icons/reaction-mind-blown.svg',
    weight: 5,
    color: '#877EFF',
  },
  vibeCheck: {
    type: 'vibeCheck',
    label: 'Vibe Check',
    icon: '/assets/icons/reaction-vibe-check.svg',
    weight: 4,
    color: '#877EFF',
  },
  realTalk: {
    type: 'realTalk',
    label: 'Real Talk',
    icon: '/assets/icons/reaction-real-talk.svg',
    weight: 5,
    color: '#877EFF',
  },
  fire: {
    type: 'fire',
    label: 'Fire',
    icon: '/assets/icons/reaction-fire.svg',
    weight: 3,
    color: '#877EFF',
  },
  heart: {
    type: 'heart',
    label: 'Love',
    icon: '/assets/icons/reaction-heart.svg',
    weight: 2,
    color: '#877EFF',
  },
};

export const REACTION_ORDER: ReactionType[] = ['fire', 'heart', 'mindBlown', 'vibeCheck', 'realTalk'];
