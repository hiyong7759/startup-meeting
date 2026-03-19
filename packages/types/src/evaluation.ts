import type { EvaluationCriterion } from './setup';

export interface EvaluationReport {
  meetingId: string;
  overallGrade: Grade;
  overallScore: number;     // 0-25
  criteriaScores: CriterionScore[];
  perspectivesShown: string[];
  perspectivesMissed: PerspectiveMissed[];
  predictedOutcomes: PredictedOutcome[];
  alternativeRoles: AlternativeRoleAnalysis[];
  meetingMinutes: MeetingMinutes;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface CriterionScore {
  criterion: EvaluationCriterion;
  score: number;  // 1-5
  comment: string;
}

export interface PerspectiveMissed {
  perspective: string;
  whoseView: string;       // Which role would have caught this
  impact: 'critical' | 'important' | 'minor';
  explanation: string;
}

export interface PredictedOutcome {
  timeframe: 'short' | 'medium' | 'long';
  description: string;
  probability: number;     // 0-1
  risk: string;
}

export interface AlternativeRoleAnalysis {
  roleTitle: string;
  wouldHaveDone: string;
  likelyOutcome: string;
}

export interface MeetingMinutes {
  topic: string;
  date: string;
  participants: string[];
  keyDiscussionPoints: DiscussionPoint[];
  decisions: string[];
  actionItems: ActionItem[];
  dissent: string[];
}

export interface DiscussionPoint {
  speaker: string;
  summary: string;
  reaction: 'agreed' | 'debated' | 'opposed';
}

export interface ActionItem {
  description: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
}
