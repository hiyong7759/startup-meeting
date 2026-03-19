export type IntentType =
  | 'decision'        // "A안으로 가자"
  | 'question'        // "예산 얼마 남았어?"
  | 'direct_character' // "CTO 의견 더 들어보자"
  | 'agree'           // "좋아", "그거 좋은데"
  | 'disagree'        // "아닌 것 같은데"
  | 'freeform';       // anything else -> vector search -> LLM

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  targetCharacterId?: string;  // for direct_character
  targetOptionId?: string;     // for decision
  rawInput: string;
}
