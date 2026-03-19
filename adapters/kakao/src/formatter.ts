import type {
  RoundStart,
  RoundResult,
  Metrics,
  GameState,
  CharacterUtterance,
} from '@startup-meeting/types';

const ROLE_EMOJI: Record<string, string> = {
  cto: '💻',
  cpo: '🎨',
  cmo: '📢',
  cfo: '💰',
  intern: '🐣',
};

export function formatRoundStart(
  roundStart: RoundStart,
  utterances: CharacterUtterance[],
): string {
  const lines: string[] = [];

  lines.push(`🔔 [Round ${roundStart.round}] 안건: ${roundStart.agenda.title}`);
  lines.push('');
  lines.push(roundStart.agenda.description);
  lines.push('');

  // Character opinions
  if (utterances.length > 0) {
    for (const u of utterances) {
      const emoji = ROLE_EMOJI[u.characterId] ?? '👤';
      lines.push(`${emoji} ${u.characterName}: ${u.text}`);
    }
    lines.push('');
  }

  // Options
  lines.push('━━━ 선택지 ━━━');
  for (let i = 0; i < roundStart.agenda.options.length; i++) {
    const opt = roundStart.agenda.options[i];
    lines.push(`${i + 1}. ${opt.label}`);
    lines.push(`   ${opt.description}`);
  }
  lines.push('');
  lines.push('💬 대표님, 어떻게 하시겠습니까?');

  // Event
  if (roundStart.event) {
    lines.push('');
    lines.push(`⚡ [이벤트] ${roundStart.event.description}`);
  }

  return lines.join('\n');
}

export function formatDecisionResult(
  result: RoundResult,
  reactions: CharacterUtterance[],
): string {
  const lines: string[] = [];

  lines.push(`✅ 결정: ${result.decision}`);
  lines.push('');

  // Character reactions
  for (const u of reactions) {
    const emoji = ROLE_EMOJI[u.characterId] ?? '👤';
    lines.push(`${emoji} ${u.characterName}: ${u.text}`);
  }

  lines.push('');
  lines.push(formatMetricsDelta(result.metricsDelta));

  return lines.join('\n');
}

export function formatMetrics(metrics: Partial<Metrics>): string {
  const runway = metrics.runway ?? 0;
  const mau = metrics.mau ?? 0;
  const techStability = metrics.techStability ?? 0;
  const teamMorale = metrics.teamMorale ?? 0;

  const runwayBar = progressBar(runway, 24);
  const mauFormatted =
    mau >= 1000
      ? `${(mau / 1000).toFixed(1)}K`
      : `${mau}`;

  return [
    '📊 현재 지표',
    `💰 런웨이: ${runway.toFixed(1)}개월 ${runwayBar}`,
    `📈 MAU: ${mauFormatted}`,
    `⚡ 기술안정성: ${techStability}% ${progressBar(techStability, 100)}`,
    `😊 팀 사기: ${teamMorale}% ${progressBar(teamMorale, 100)}`,
  ].join('\n');
}

export function formatGameOver(state: GameState): string {
  const reasons: Record<string, string> = {
    runway_exhausted: '💀 런웨이가 소진되었습니다. 회사가 파산했습니다.',
    no_users: '💀 유저가 모두 떠났습니다. 서비스가 종료됩니다.',
    team_collapsed: '💀 팀원들이 모두 퇴사했습니다. 회사가 해산됩니다.',
    max_rounds_reached: '🎉 축하합니다! 20라운드를 버텨냈습니다!',
  };

  const lines = [
    '━━━ 게임 종료 ━━━',
    reasons[state.gameOverReason ?? ''] ?? '게임이 종료되었습니다.',
    '',
    `📊 최종 성적 (${state.round}라운드)`,
    formatMetrics(state.metrics),
    '',
    '"게임시작"을 입력하면 새 게임을 시작합니다.',
  ];

  return lines.join('\n');
}

function formatMetricsDelta(delta: Partial<Metrics>): string {
  const parts: string[] = [];
  if (delta.runway) parts.push(`런웨이 ${formatDelta(delta.runway)}개월`);
  if (delta.mau) parts.push(`MAU ${formatDelta(delta.mau)}`);
  if (delta.techStability) parts.push(`기술 ${formatDelta(delta.techStability)}%`);
  if (delta.teamMorale) parts.push(`사기 ${formatDelta(delta.teamMorale)}%`);
  return `📊 ${parts.join(' | ')}`;
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function progressBar(value: number, max: number): string {
  const filled = Math.round((value / max) * 10);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, 10 - filled));
}
