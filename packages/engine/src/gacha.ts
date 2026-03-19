import type {
  GachaResult,
  GachaTopic,
  GachaBonus,
  GachaProbabilities,
  GachaBonusProbabilities,
  TopicRarity,
} from '@startup-meeting/types';
import gachaTopicsData from '../data/gacha-topics.json' with { type: 'json' };

const TOPIC_PROBABILITIES: GachaProbabilities = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.12,
  legendary: 0.03,
};

const BONUS_PROBABILITIES: GachaBonusProbabilities = {
  hidden_character: 0.20,
  start_event: 0.15,
  double_xp: 0.10,
  card_drop_up: 0.10,
  legendary_upgrade: 0.05,
};

export function pullGacha(): GachaResult {
  const rarity = rollRarity();
  const topic = pickTopicByRarity(rarity);
  const bonuses = rollBonuses();

  // Check legendary upgrade
  const isUpgraded = bonuses.some((b) => b.type === 'legendary_upgrade');
  const finalTopic = isUpgraded && rarity !== 'legendary'
    ? pickTopicByRarity('legendary')
    : topic;

  return {
    topic: finalTopic,
    bonuses: bonuses.filter((b) => b.type !== 'legendary_upgrade'),
    isUpgraded,
  };
}

export function pullGachaByRarity(rarity: TopicRarity): GachaTopic {
  return pickTopicByRarity(rarity);
}

function rollRarity(): TopicRarity {
  const roll = Math.random();
  let cumulative = 0;

  const entries: [TopicRarity, number][] = [
    ['legendary', TOPIC_PROBABILITIES.legendary],
    ['rare', TOPIC_PROBABILITIES.rare],
    ['uncommon', TOPIC_PROBABILITIES.uncommon],
    ['common', TOPIC_PROBABILITIES.common],
  ];

  for (const [rarity, prob] of entries) {
    cumulative += prob;
    if (roll < cumulative) return rarity;
  }

  return 'common';
}

function pickTopicByRarity(rarity: TopicRarity): GachaTopic {
  const topics = (gachaTopicsData as GachaTopic[]).filter((t) => t.rarity === rarity);
  if (topics.length === 0) {
    // Fallback to any topic
    const all = gachaTopicsData as GachaTopic[];
    return all[Math.floor(Math.random() * all.length)];
  }
  return topics[Math.floor(Math.random() * topics.length)];
}

function rollBonuses(): GachaBonus[] {
  const bonuses: GachaBonus[] = [];

  const bonusTypes: { type: GachaBonus['type']; prob: number; desc: string }[] = [
    { type: 'hidden_character', prob: BONUS_PROBABILITIES.hidden_character, desc: '히든 캐릭터가 회의에 참석합니다!' },
    { type: 'start_event', prob: BONUS_PROBABILITIES.start_event, desc: '회의 시작부터 이벤트 발생!' },
    { type: 'double_xp', prob: BONUS_PROBABILITIES.double_xp, desc: '이번 회의 XP 2배!' },
    { type: 'card_drop_up', prob: BONUS_PROBABILITIES.card_drop_up, desc: '카드 드롭 확률 2배!' },
    { type: 'legendary_upgrade', prob: BONUS_PROBABILITIES.legendary_upgrade, desc: '등급 레전더리로 승격!' },
  ];

  for (const bonus of bonusTypes) {
    if (Math.random() < bonus.prob) {
      bonuses.push({ type: bonus.type, description: bonus.desc });
    }
  }

  return bonuses;
}

export function getTopicProbabilities(): GachaProbabilities {
  return { ...TOPIC_PROBABILITIES };
}
