import type { GameState, RoundStart, RoundResult, Agenda, CharacterUtterance } from '@startup-meeting/types';
import { applyMetricsDelta, checkGameOver, resolveMetrics } from './state';
import { shouldFireEvent, selectEvent } from './events';
import { getCharacterOpinionOrder, getCharacter } from './characters';
import { findMatchingOption, applyDecision } from './decisions';
import agendasData from '../data/agendas.json' with { type: 'json' };

export function startRound(state: GameState): { state: GameState; roundStart: RoundStart } {
  const nextRound = state.round + 1;
  const agenda = selectAgenda(state);
  const speakOrder = getCharacterOpinionOrder(agenda, resolveMetrics(state.metrics));

  // Create placeholder utterances (to be filled by composer layer)
  const utterances: CharacterUtterance[] = speakOrder.map((charId) => {
    const char = getCharacter(charId);
    return {
      characterId: charId,
      characterName: char.name,
      text: '', // filled by composer
      type: 'opinion' as const,
      emotion: 'neutral' as const,
    };
  });

  const event = shouldFireEvent(state) ? selectEvent(state) : null;

  const newState: GameState = {
    ...state,
    round: nextRound,
    sessionPhase: 'meeting_active',
    activeEvent: event,
  };

  // Apply immediate event effect if any
  if (event?.immediateEffect) {
    newState.metrics = applyMetricsDelta(newState.metrics, event.immediateEffect);
  }

  return {
    state: newState,
    roundStart: { round: nextRound, agenda, characterUtterances: utterances, event },
  };
}

export function submitDecision(
  state: GameState,
  agenda: Agenda,
  decisionText: string,
): { state: GameState; result: RoundResult; matchedOption: boolean } {
  const option = findMatchingOption(agenda, decisionText);

  let result: RoundResult;
  if (option) {
    result = applyDecision(state, agenda, option);
  } else {
    // Free-form decision: small random effect
    const delta = {
      runway: -0.5,
      teamMorale: Math.random() > 0.5 ? 3 : -2,
    };
    result = {
      round: state.round,
      agenda,
      decision: decisionText,
      metricsDelta: delta,
      metricsAfter: applyMetricsDelta(state.metrics, delta),
      event: state.activeEvent,
    };
  }

  const gameOverCheck = checkGameOver({ ...state, metrics: result.metricsAfter, round: state.round });

  const newState: GameState = {
    ...state,
    metrics: result.metricsAfter,
    sessionPhase: 'evaluation',
    history: [...state.history, result],
    activeEvent: null,
    isGameOver: gameOverCheck.isOver,
    gameOverReason: gameOverCheck.reason,
  };

  return { state: newState, result, matchedOption: !!option };
}

function selectAgenda(state: GameState): Agenda {
  const allAgendas = agendasData as Agenda[];
  const usedIds = new Set(state.history.map((r) => r.agenda.id));
  const available = allAgendas.filter((a) => !usedIds.has(a.id));

  if (available.length === 0) {
    return allAgendas[Math.floor(Math.random() * allAgendas.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}
