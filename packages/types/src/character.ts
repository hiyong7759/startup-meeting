export type CharacterId = 'cto' | 'cpo' | 'cmo' | 'cfo' | 'intern';

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  personality: Personality;
  speakingStyle: string;
  catchphrases: string[];
  biases: Record<string, number>; // topic -> opinion weight (-1 to 1)
}

export interface Personality {
  assertiveness: number;  // 0-1: how strongly they push their opinion
  optimism: number;       // 0-1: glass half full or empty
  riskTolerance: number;  // 0-1: embrace or avoid risk
  creativity: number;     // 0-1: conventional vs unconventional
  empathy: number;        // 0-1: people-focused vs task-focused
}

export interface CharacterUtterance {
  characterId: CharacterId;
  characterName: string;
  text: string;
  type: 'opinion' | 'reaction' | 'debate' | 'event_reaction' | 'decision_reaction';
  emotion: 'neutral' | 'positive' | 'negative' | 'surprised' | 'frustrated' | 'excited';
}
