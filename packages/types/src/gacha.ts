import type { TopicRarity, GachaBonus } from './setup';

export interface GachaPool {
  topics: GachaTopic[];
}

export interface GachaTopic {
  id: string;
  title: string;
  description: string;
  rarity: TopicRarity;
  category: string;
}

export interface GachaResult {
  topic: GachaTopic;
  bonuses: GachaBonus[];
  isUpgraded: boolean;    // legendary_upgrade triggered
}

export interface GachaProbabilities {
  common: number;     // 0.60
  uncommon: number;   // 0.25
  rare: number;       // 0.12
  legendary: number;  // 0.03
}

export interface GachaBonusProbabilities {
  hidden_character: number;   // 0.20
  start_event: number;        // 0.15
  double_xp: number;          // 0.10
  card_drop_up: number;       // 0.10
  legendary_upgrade: number;  // 0.05
}
