import type { CharacterUtterance } from './character';
import type { GameEvent } from './event';
import type { SessionPhase, MeetingSetup } from './setup';

export interface Metrics {
  runway: number;          // months remaining, 0 = game over
  mau: number;             // monthly active users
  techStability: number;   // 0-100%
  teamMorale: number;      // 0-100%
  [key: string]: number;   // dynamic metrics per meeting topic
}

export interface GameConfig {
  companyName: string;
  initialMetrics?: Partial<Metrics>;
  maxRounds?: number;
}

export interface GameState {
  id: string;
  companyName: string;
  round: number;
  maxRounds: number;
  sessionPhase: SessionPhase;
  playerRole: string | null;        // role id the user picked
  meetingSetup: MeetingSetup | null;
  metrics: Partial<Metrics>;        // optional/dynamic — not all meetings use all 4
  history: RoundResult[];
  activeEvent: GameEvent | null;
  isGameOver: boolean;
  gameOverReason?: string;
}

export type RoundPhase =
  | 'agenda_present'     // agenda presented, characters speak
  | 'discussion'         // characters debate
  | 'event_fired'        // random event occurred
  | 'awaiting_decision'  // waiting for user (CEO) input
  | 'decision_applied'   // decision processed, metrics updated
  | 'round_end';         // round complete

export interface RoundStart {
  round: number;
  agenda: Agenda;
  characterUtterances: CharacterUtterance[];
  event: GameEvent | null;
}

export interface RoundResult {
  round: number;
  agenda: Agenda;
  decision: string;
  metricsDelta: Partial<Metrics>;
  metricsAfter: Partial<Metrics>;
  event: GameEvent | null;
}

export interface Agenda {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'engineering' | 'marketing' | 'finance' | 'hr' | 'strategy';
  options: AgendaOption[];
}

export interface AgendaOption {
  id: string;
  label: string;
  description: string;
  metricsDelta: Partial<Metrics>;
}
