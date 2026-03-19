import type { Personality } from './character';

export type Department =
  | 'executive'
  | 'engineering'
  | 'product'
  | 'marketing'
  | 'finance'
  | 'hr'
  | 'sales'
  | 'design'
  | 'data'
  | 'legal'
  | 'operations';

export type HierarchyLevel = 'executive' | 'manager' | 'senior' | 'junior' | 'intern';

export type DecisionPower =
  | 'final'          // CEO — makes final call
  | 'strong_voice'   // C-level — heavy influence
  | 'recommend'      // Senior/specialist — proposes solutions
  | 'opinion_only';  // Junior/intern — can speak but may be ignored

export type InfoAccess =
  | 'full'           // Executives — see all metrics
  | 'department'     // Managers — own dept + summary
  | 'limited'        // Seniors — task-relevant data only
  | 'minimal';       // Juniors — only what's been shared

export interface Role {
  id: string;
  title: string;
  department: Department;
  level: HierarchyLevel;
  expertise: string[];
  decisionPower: DecisionPower;
  informationAccess: InfoAccess;
  personality: Personality;
  speakingStyle: string;
  catchphrases: string[];
}
