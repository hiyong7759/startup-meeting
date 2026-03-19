import type { GameState, GameEvent, Metrics } from '@startup-meeting/types';
import eventsData from '../data/events.json' with { type: 'json' };

const BASE_EVENT_PROBABILITY = 0.4;

export function shouldFireEvent(state: GameState): boolean {
  let probability = BASE_EVENT_PROBABILITY;
  // Low stability increases event probability
  if ((state.metrics.techStability ?? 0) < 40) probability += 0.2;
  // Low morale increases event probability
  if ((state.metrics.teamMorale ?? 0) < 30) probability += 0.15;
  // Low runway increases event probability
  if ((state.metrics.runway ?? 0) < 6) probability += 0.1;
  return Math.random() < Math.min(probability, 0.8);
}

export function selectEvent(state: GameState): GameEvent {
  const usedEventIds = new Set(
    state.history.filter((r) => r.event).map((r) => r.event!.id),
  );

  const eligible = (eventsData as GameEvent[]).filter((e) => {
    if (usedEventIds.has(e.id)) return false;
    if (!e.metricsTrigger) return true;
    return checkMetricsTrigger(state.metrics, e.metricsTrigger);
  });

  if (eligible.length === 0) {
    // Reset pool if all used
    const all = eventsData as GameEvent[];
    return all[Math.floor(Math.random() * all.length)];
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

function checkMetricsTrigger(
  metrics: Partial<Metrics>,
  trigger: Partial<Record<keyof Metrics, { below?: number; above?: number }>>,
): boolean {
  for (const [key, condition] of Object.entries(trigger)) {
    const value = metrics[key as keyof Metrics] ?? 0;
    if (condition?.below !== undefined && value >= condition.below) return false;
    if (condition?.above !== undefined && value <= condition.above) return false;
  }
  return true;
}

export function getEvents(): GameEvent[] {
  return eventsData as GameEvent[];
}
