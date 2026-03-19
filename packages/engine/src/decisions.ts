import type { GameState, Agenda, AgendaOption, RoundResult, Metrics } from '@startup-meeting/types';
import { applyMetricsDelta, resolveMetrics } from './state';

export function findMatchingOption(agenda: Agenda, decisionText: string): AgendaOption | null {
  const lower = decisionText.toLowerCase();

  // Direct option reference by number or label
  for (let i = 0; i < agenda.options.length; i++) {
    const opt = agenda.options[i];
    if (
      lower.includes(opt.label.toLowerCase()) ||
      lower.includes(`${i + 1}번`) ||
      lower.includes(`${i + 1}안`)
    ) {
      return opt;
    }
  }
  return null;
}

export function applyDecision(
  state: GameState,
  agenda: Agenda,
  option: AgendaOption,
): RoundResult {
  const eventEffect = state.activeEvent?.immediateEffect ?? {};
  const combinedDelta = combineDelta(option.metricsDelta, eventEffect);
  const metricsAfter = applyMetricsDelta(resolveMetrics(state.metrics), combinedDelta);

  return {
    round: state.round,
    agenda,
    decision: option.label,
    metricsDelta: combinedDelta,
    metricsAfter,
    event: state.activeEvent,
  };
}

function combineDelta(a: Partial<Metrics>, b: Partial<Metrics>): Partial<Metrics> {
  const result: Partial<Metrics> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const k = key as keyof Metrics;
    result[k] = ((result[k] ?? 0) + (value ?? 0));
  }
  return result;
}
