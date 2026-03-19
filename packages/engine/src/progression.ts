import type {
  PlayerProfile,
  XpReward,
  LevelThreshold,
  CharacterCard,
  CardRarity,
  Achievement,
  CardDropProbabilities,
  Grade,
  TopicRarity,
} from '@startup-meeting/types';
import achievementsData from '../data/achievements.json' with { type: 'json' };

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: '신입 회의원', unlocks: ['일상 주제'] },
  { level: 2, xpRequired: 200, title: '회의 참석자', unlocks: [] },
  { level: 3, xpRequired: 500, title: '회의 발언자', unlocks: [] },
  { level: 5, xpRequired: 1200, title: '회의 숙련자', unlocks: [] },
  { level: 6, xpRequired: 1800, title: '회의 달인', unlocks: ['전략 주제 해금'] },
  { level: 10, xpRequired: 4000, title: '경영 참모', unlocks: [] },
  { level: 11, xpRequired: 5000, title: '경영 전문가', unlocks: ['위기 주제 해금'] },
  { level: 15, xpRequired: 9000, title: '전략가', unlocks: [] },
  { level: 16, xpRequired: 11000, title: '전설의 대표', unlocks: ['레전더리 확률 UP'] },
  { level: 20, xpRequired: 18000, title: '회의의 신', unlocks: ['히든 시나리오'] },
];

const CARD_DROP_PROBABILITIES: CardDropProbabilities = {
  common: 0.60,
  rare: 0.25,
  epic: 0.12,
  legendary: 0.03,
};

const BASE_XP: Record<TopicRarity | string, number> = {
  common: 75,
  uncommon: 150,
  rare: 300,
  legendary: 750,
};

export function createNewProfile(nickname: string): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    nickname,
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    title: '신입 회의원',
    gachaTickets: 3,  // starter tickets
    cards: [],
    achievements: [],
    meetingHistory: [],
    stats: {
      totalMeetings: 0,
      totalXp: 0,
      averageGrade: 0,
      favoriteRole: '',
      bestGrade: '',
      uniqueRolesPlayed: 0,
      uniqueCardsCollected: 0,
    },
  };
}

export function calculateXpReward(
  topicRarity: TopicRarity,
  grade: Grade,
  missedPerspectives: number,
  hasDoubleXp: boolean,
): XpReward {
  const base = BASE_XP[topicRarity] ?? 75;

  const gradeMultipliers: Record<Grade, number> = {
    S: 2.0, A: 1.5, B: 1.0, C: 0.7, D: 0.4,
  };
  const gradeBonus = Math.round(base * (gradeMultipliers[grade] - 1));

  const perfectBonus = missedPerspectives === 0 ? Math.round(base * 0.3) : 0;
  const interruptBonus = 0; // TODO: implement when interrupt feature is added

  let total = base + gradeBonus + perfectBonus + interruptBonus;
  if (hasDoubleXp) total *= 2;

  return { base, gradeBonus, perfectBonus, interruptBonus, total };
}

export function applyXp(profile: PlayerProfile, xp: number): PlayerProfile {
  const newXp = profile.xp + xp;
  let newLevel = profile.level;
  let newTitle = profile.title;
  let newXpToNext = profile.xpToNextLevel;

  // Check level ups
  for (const threshold of LEVEL_THRESHOLDS) {
    if (newXp >= threshold.xpRequired && threshold.level > newLevel) {
      newLevel = threshold.level;
      newTitle = threshold.title;
    }
  }

  // Calculate xp to next level
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level > newLevel);
  newXpToNext = nextThreshold ? nextThreshold.xpRequired - newXp : 0;

  return {
    ...profile,
    xp: newXp,
    level: newLevel,
    title: newTitle,
    xpToNextLevel: Math.max(0, newXpToNext),
  };
}

export function rollCardDrop(
  participantRoleIds: string[],
  participantRoleTitles: string[],
  meetingId: string,
  hasCardDropUp: boolean,
): CharacterCard | null {
  // Base 40% chance to get a card, 80% with bonus
  const dropChance = hasCardDropUp ? 0.80 : 0.40;
  if (Math.random() > dropChance) return null;

  const rarity = rollCardRarity(hasCardDropUp);
  const idx = Math.floor(Math.random() * participantRoleIds.length);

  return {
    id: crypto.randomUUID(),
    roleId: participantRoleIds[idx],
    roleTitle: participantRoleTitles[idx],
    rarity,
    obtainedAt: new Date().toISOString(),
    meetingId,
  };
}

function rollCardRarity(hasBonus: boolean): CardRarity {
  const probs = { ...CARD_DROP_PROBABILITIES };
  if (hasBonus) {
    probs.legendary *= 2;
    probs.epic *= 2;
    probs.rare *= 1.5;
    probs.common = 1 - probs.legendary - probs.epic - probs.rare;
  }

  const roll = Math.random();
  let cumulative = 0;

  const entries: [CardRarity, number][] = [
    ['legendary', probs.legendary],
    ['epic', probs.epic],
    ['rare', probs.rare],
    ['common', probs.common],
  ];

  for (const [rarity, prob] of entries) {
    cumulative += prob;
    if (roll < cumulative) return rarity;
  }

  return 'common';
}

export function checkAchievements(profile: PlayerProfile): Achievement[] {
  const allAchievements = achievementsData as Achievement[];
  const unlockedIds = new Set(profile.achievements.map((a) => a.id));
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    // Check conditions based on achievement ID patterns
    if (checkAchievementCondition(achievement.id, profile)) {
      newlyUnlocked.push({
        ...achievement,
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  return newlyUnlocked;
}

function checkAchievementCondition(achievementId: string, profile: PlayerProfile): boolean {
  switch (achievementId) {
    case 'first_meeting': return profile.stats.totalMeetings >= 1;
    case 'meeting_10': return profile.stats.totalMeetings >= 10;
    case 'meeting_50': return profile.stats.totalMeetings >= 50;
    case 'level_5': return profile.level >= 5;
    case 'level_10': return profile.level >= 10;
    case 'level_20': return profile.level >= 20;
    case 'gacha_10': return profile.stats.totalMeetings >= 10; // approximate
    case 'gacha_50': return profile.stats.totalMeetings >= 50;
    case 'cards_10': return profile.stats.uniqueCardsCollected >= 10;
    case 'cards_all': return profile.stats.uniqueCardsCollected >= 30;
    case 'roles_5': return profile.stats.uniqueRolesPlayed >= 5;
    case 'roles_all': return profile.stats.uniqueRolesPlayed >= 20;
    case 's_grade': return profile.meetingHistory.some((m) => m.grade === 'S');
    case 'intern_s': return profile.meetingHistory.some(
      (m) => m.grade === 'S' && m.rolePlayedTitle.includes('인턴'),
    );
    default: return false;
  }
}

export function getLevelThresholds(): LevelThreshold[] {
  return [...LEVEL_THRESHOLDS];
}

export function getCardDropProbabilities(): CardDropProbabilities {
  return { ...CARD_DROP_PROBABILITIES };
}
