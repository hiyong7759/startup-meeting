import { Hono } from 'hono';
import type { GameState, Agenda } from '@startup-meeting/types';
import { createGameState, startRound, submitDecision } from '@startup-meeting/engine';
// TODO: re-wire to updated composer API once generateResponses is re-exported
import { formatRoundStart, formatDecisionResult, formatMetrics, formatGameOver } from './formatter';

const app = new Hono();

// In-memory game sessions (will be replaced with Supabase)
const sessions = new Map<string, { state: GameState; currentAgenda: Agenda | null }>();

// Kakao i Open Builder skill endpoint
app.post('/api/kakao/skill', async (c) => {
  const body = await c.req.json();
  const userRequest = body.userRequest;
  const userId: string = userRequest?.user?.id ?? 'anonymous';
  const utterance: string = userRequest?.utterance ?? '';

  // Get or create session
  let session = sessions.get(userId);

  // Handle commands
  if (utterance === '게임시작' || utterance === '시작' || !session) {
    return c.json(handleGameStart(userId));
  }

  if (utterance === '상태' || utterance === '지표' || utterance === '현황') {
    return c.json(formatKakaoResponse(formatMetrics(session.state.metrics)));
  }

  if (session.state.isGameOver) {
    return c.json(formatKakaoResponse(formatGameOver(session.state)));
  }

  // Game is in progress — process decision
  if (!session.currentAgenda) {
    // Start new round
    const { state: newState, roundStart } = startRound(session.state);
    session.state = newState;
    session.currentAgenda = roundStart.agenda;
    sessions.set(userId, session);

    // TODO: replace with updated composer API
    return c.json(formatKakaoResponse(
      formatRoundStart(roundStart, roundStart.characterUtterances),
    ));
  }

  // Process user decision
  const { state: newState, result } = submitDecision(
    session.state,
    session.currentAgenda,
    utterance,
  );

  session.state = newState;
  session.currentAgenda = null; // Ready for next round
  sessions.set(userId, session);

  // TODO: replace with updated composer API
  if (newState.isGameOver) {
    const text =
      formatDecisionResult(result, []) +
      '\n\n' +
      formatGameOver(newState);
    return c.json(formatKakaoResponse(text));
  }

  return c.json(formatKakaoResponse(
    formatDecisionResult(result, []),
  ));
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

function handleGameStart(userId: string): object {
  const state = createGameState({ companyName: '우리 스타트업' });
  const { state: newState, roundStart } = startRound(state);
  sessions.set(userId, { state: newState, currentAgenda: roundStart.agenda });

  const text = [
    '🏢 스타트업 회의실에 오신 걸 환영합니다!',
    `당신은 "${newState.companyName}"의 대표입니다.`,
    '',
    formatMetrics(newState.metrics),
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    formatRoundStart(roundStart, []),
  ].join('\n');

  return formatKakaoResponse(text);
}

function formatKakaoResponse(text: string): object {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: {
            text: text.slice(0, 1000), // Kakao limit
          },
        },
      ],
      quickReplies: [
        { label: '📊 현황 보기', action: 'message', messageText: '상태' },
        { label: '⏭️ 다음 안건', action: 'message', messageText: '다음' },
      ],
    },
  };
}

export default app;
