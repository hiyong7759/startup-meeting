import type { Role } from './role';

export type SessionPhase =
  | 'idle'                // Main menu
  | 'topic_input'         // User entering topic
  | 'context_gathering'   // AI asking clarifying questions
  | 'meeting_setup'       // AI generating participants/agenda
  | 'role_selection'      // User choosing their role
  | 'meeting_active'      // Meeting in progress
  | 'evaluation'          // Post-meeting evaluation
  | 'complete';           // Results displayed

export interface ContextQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'free_text';
  options?: string[];
  answer?: string;
}

export interface MeetingSetup {
  topic: string;
  topicRarity?: TopicRarity;
  context: ContextQuestion[];
  agenda: DynamicAgenda;
  participants: MeetingParticipant[];
  evaluationCriteria: EvaluationCriterion[];
  gachaBonus?: GachaBonus[];
}

export interface DynamicAgenda {
  title: string;
  description: string;
  category: string;
  keyQuestions: string[];
  possibleOutcomes: string[];
}

export interface MeetingParticipant {
  role: Role;
  relevance: string;        // Why they're in this meeting
  initialStance: string;    // Their likely position on the topic
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;  // 1-5, importance
}

export type TopicRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface GachaBonus {
  type: 'hidden_character' | 'start_event' | 'double_xp' | 'card_drop_up' | 'legendary_upgrade';
  description: string;
}
