import type { GameState, GameConfig, Metrics } from '@startup-meeting/types';

const DEFAULT_METRICS: Metrics = {
  runway: 18,
  mau: 5000,
  techStability: 70,
  teamMorale: 75,
};

export function resolveMetrics(partial: Partial<Metrics>): Metrics {
  return {
    runway: partial.runway ?? 0,
    mau: partial.mau ?? 0,
    techStability: partial.techStability ?? 0,
    teamMorale: partial.teamMorale ?? 0,
  };
}

export function createGameState(config: GameConfig): GameState {
  return {
    id: crypto.randomUUID(),
    companyName: config.companyName,
    round: 0,
    maxRounds: config.maxRounds ?? 20,
    sessionPhase: 'idle',
    playerRole: null,
    meetingSetup: null,
    metrics: { ...DEFAULT_METRICS, ...config.initialMetrics },
    history: [],
    activeEvent: null,
    isGameOver: false,
  };
}

export function applyMetricsDelta(
  metrics: Partial<Metrics>,
  delta: Partial<Metrics>,
): Metrics {
  const result = resolveMetrics(metrics);
  if (delta.runway !== undefined) result.runway = Math.max(0, result.runway + delta.runway);
  if (delta.mau !== undefined) result.mau = Math.max(0, result.mau + delta.mau);
  if (delta.techStability !== undefined)
    result.techStability = Math.min(100, Math.max(0, result.techStability + delta.techStability));
  if (delta.teamMorale !== undefined)
    result.teamMorale = Math.min(100, Math.max(0, result.teamMorale + delta.teamMorale));
  return result;
}

export function checkGameOver(state: GameState): { isOver: boolean; reason?: string } {
  if ((state.metrics.runway ?? 0) <= 0) return { isOver: true, reason: 'runway_exhausted' };
  if ((state.metrics.mau ?? 0) <= 0) return { isOver: true, reason: 'no_users' };
  if ((state.metrics.teamMorale ?? 0) <= 0) return { isOver: true, reason: 'team_collapsed' };
  if (state.round >= state.maxRounds) return { isOver: true, reason: 'max_rounds_reached' };
  return { isOver: false };
}
