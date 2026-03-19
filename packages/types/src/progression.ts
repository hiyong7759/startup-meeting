import type { Grade } from './evaluation';

export interface PlayerProfile {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;
  gachaTickets: number;
  cards: CharacterCard[];
  achievements: Achievement[];
  meetingHistory: MeetingHistoryEntry[];
  stats: PlayerStats;
}

export interface CharacterCard {
  id: string;
  roleId: string;
  roleTitle: string;
  rarity: CardRarity;
  obtainedAt: string;   // ISO date
  meetingId: string;    // which meeting it dropped from
}

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CardDropProbabilities {
  common: number;     // 0.60
  rare: number;       // 0.25
  epic: number;       // 0.12
  legendary: number;  // 0.03
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;  // ISO date, undefined = locked
}

export interface MeetingHistoryEntry {
  id: string;
  date: string;
  topic: string;
  rolePlayedId: string;
  rolePlayedTitle: string;
  grade: Grade;
  score: number;
  xpEarned: number;
  cardsDropped: CharacterCard[];
}

export interface PlayerStats {
  totalMeetings: number;
  totalXp: number;
  averageGrade: number;
  favoriteRole: string;
  bestGrade: string;
  uniqueRolesPlayed: number;
  uniqueCardsCollected: number;
}

export interface XpReward {
  base: number;
  gradeBonus: number;
  perfectBonus: number;    // no missed perspectives
  interruptBonus: number;  // successful interruption
  total: number;
}

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
  unlocks: string[];  // what features unlock
}
