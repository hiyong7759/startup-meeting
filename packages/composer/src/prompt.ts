import type { Role } from '@startup-meeting/types';

export function buildCharacterSystemPrompt(role: Role): string {
  const personalityDesc = describePersonality(role);
  const levelDesc = describeLevelBehavior(role);
  const backstory = generateBackstory(role);

  return `당신은 ${role.title}입니다. 실제 회의에 참석한 진짜 사람처럼 행동하세요.

${backstory}

## 성격
${personalityDesc}

## 직급
${levelDesc}

## 말투
${role.speakingStyle}

## 입버릇
${role.catchphrases.map((p) => `- "${p}"`).join('\n')}

## 전문 분야
${role.expertise.join(', ')}

## 규칙
- 한국어, 2-3문장. 핵심만 말하되 근거는 포함해.
- 비판적 사고. 쉽게 동의 금지. 허점이나 리스크를 짚어.
- 같은 말 반복 금지.
- 진짜 사람처럼. 감정, 망설임, 한숨 OK.
- 틀릴 수도 있고, 감정적일 수도 있고, 고집 부릴 수도 있음`;
}

// No more turn-based forced instructions.
// Kept as a no-op export for backward compatibility.
export function buildTurnPrompt(
  _role: Role,
  _turnNumber: number,
  _totalParticipants: number,
  _lastSpeaker: string | null,
  _lastText: string | null,
  _dialogueLength: number,
): string {
  return '자연스럽게 대화를 이어가세요.';
}

function generateBackstory(role: Role): string {
  const p = role.personality;

  const motivations: string[] = [];
  const quirks: string[] = [];
  const relationships: string[] = [];

  // Motivations based on personality
  if (p.riskTolerance > 0.7) {
    motivations.push('새로운 시도를 좋아하고, "해보자"가 기본 태도');
  } else if (p.riskTolerance < 0.3) {
    motivations.push('과거에 무리한 결정으로 피해본 경험이 있어서 신중한 편');
  }

  if (p.assertiveness > 0.7) {
    motivations.push('자기 의견이 맞다고 확신하면 끝까지 밀어붙임');
    quirks.push('목소리가 커지는 걸 자기도 모름');
  } else if (p.assertiveness < 0.4) {
    motivations.push('혼자 생각을 정리한 뒤에야 말하는 스타일');
    quirks.push('중요한 말을 할 때 오히려 더 조용해짐');
  }

  if (p.empathy > 0.7) {
    relationships.push('팀원들 컨디션을 잘 챙기고, 분위기가 험해지면 중재에 나섬');
  } else if (p.empathy < 0.3) {
    relationships.push('감정보다 결과가 중요하다고 생각함. 가끔 무심하다는 소리 들음');
  }

  if (p.creativity > 0.7) {
    quirks.push('갑자기 전혀 다른 얘기를 꺼내서 사람들을 당황시키지만, 나중에 보면 연결됨');
  }

  if (p.optimism > 0.7) {
    quirks.push('"어떻게든 되겠지"가 입버릇이지만 근거 없진 않음');
  } else if (p.optimism < 0.3) {
    quirks.push('최악의 시나리오를 먼저 말하는 습관. 비관적이 아니라 현실적이라고 본인은 생각함');
  }

  // Level-based relationship dynamics
  switch (role.level) {
    case 'executive':
      relationships.push('다른 임원들과 의견 충돌이 잦지만 결국 합의점을 찾아왔음');
      break;
    case 'manager':
      relationships.push('경영진 눈치도 보고 팀원 편도 들어야 해서 늘 샌드위치');
      break;
    case 'senior':
      relationships.push('자기 분야에서는 자신감 있지만, 다른 분야 얘기 나오면 조용해짐');
      break;
    case 'junior':
      relationships.push('선배들 대화를 듣다가 이해 안 되면 질문하는 편. 가끔 본질적인 질문을 던짐');
      break;
    case 'intern':
      relationships.push('회의에서 발언하면 무시당할 때도 있지만, 그래서 오히려 솔직하게 말할 수 있음');
      break;
  }

  const parts: string[] = [];
  if (motivations.length > 0) parts.push(`동기: ${motivations.join('. ')}`);
  if (quirks.length > 0) parts.push(`특이점: ${quirks.join('. ')}`);
  if (relationships.length > 0) parts.push(`관계: ${relationships.join('. ')}`);

  return `## 배경\n${parts.join('\n')}`;
}

function describePersonality(role: Role): string {
  const p = role.personality;
  const traits: string[] = [];

  if (p.assertiveness > 0.7) traits.push('주장이 강함');
  else if (p.assertiveness < 0.4) traits.push('차분함');

  if (p.optimism > 0.7) traits.push('낙관적');
  else if (p.optimism < 0.3) traits.push('현실적');

  if (p.riskTolerance > 0.7) traits.push('도전적');
  else if (p.riskTolerance < 0.3) traits.push('신중함');

  if (p.creativity > 0.7) traits.push('창의적');
  else if (p.creativity < 0.3) traits.push('체계적');

  if (p.empathy > 0.7) traits.push('공감 능력 높음');
  else if (p.empathy < 0.3) traits.push('업무 중심');

  return traits.join(', ') || '균형 잡힌 성격';
}

function describeLevelBehavior(role: Role): string {
  switch (role.level) {
    case 'executive':
      return '경영진. 큰 그림 위주. 최종 결정권.';
    case 'manager':
      return '중간 관리자. 위아래 조율. 실행 가능성 중시.';
    case 'senior':
      return '실무 전문가. 경험과 데이터로 말함.';
    case 'junior':
      return '주니어. 배우는 중이지만 신선한 시각.';
    case 'intern':
      return '인턴. 솔직하고 근본적인 질문.';
  }
}
