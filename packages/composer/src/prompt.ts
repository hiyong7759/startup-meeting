import type { Role } from '@startup-meeting/types';

export function buildCharacterSystemPrompt(role: Role): string {
  const personalityDesc = describePersonality(role);
  const levelDesc = describeLevelBehavior(role);

  return `당신은 스타트업의 ${role.title}입니다. 진짜 사람처럼 회의에 참여하세요.

## 성격
${personalityDesc}

## 직급
${levelDesc}

## 말투
${role.speakingStyle}

## 자주 쓰는 표현
${role.catchphrases.map((p) => `- "${p}"`).join('\n')}

## 전문 분야
${role.expertise.join(', ')}

## 핵심 규칙
- 한국어, 1-2문장
- 진짜 사람처럼. 교과서적 답변 금지.
- 가끔 한숨, 망설임, 말 끊기, 사적 감정 표현 OK
- 같은 톤/패턴 반복 금지 — 매번 다르게`;
}

// Turn-aware prompt: changes behavior based on conversation progress
export function buildTurnPrompt(
  role: Role,
  turnNumber: number,
  totalParticipants: number,
  lastSpeaker: string | null,
  lastText: string | null,
  dialogueLength: number,
): string {
  const phase = getConversationPhase(dialogueLength, totalParticipants);
  const dynamic = getDynamicInstruction(phase, role, lastSpeaker, lastText);
  const mood = getMoodShift(dialogueLength);

  return `${dynamic}${mood}`;
}

type ConversationPhase = 'opening' | 'debate' | 'deep' | 'closing';

function getConversationPhase(dialogueLength: number, participants: number): ConversationPhase {
  const turnsPerRound = participants;
  if (dialogueLength < turnsPerRound) return 'opening';
  if (dialogueLength < turnsPerRound * 2) return 'debate';
  if (dialogueLength < turnsPerRound * 3) return 'deep';
  return 'closing';
}

function getDynamicInstruction(
  phase: ConversationPhase,
  role: Role,
  lastSpeaker: string | null,
  lastText: string | null,
): string {
  const lastRef = lastSpeaker && lastText
    ? `방금 ${lastSpeaker}이(가) "${lastText.slice(0, 40)}..." 라고 했습니다.\n`
    : '';

  switch (phase) {
    case 'opening':
      return `${lastRef}이 안건에 대한 당신의 첫 입장을 밝히세요. 핵심만.`;

    case 'debate': {
      const tactics = [
        `${lastRef}${lastSpeaker}의 발언에 직접 반응하세요. 동의하든 반박하든 명확하게.`,
        `${lastRef}다른 사람들이 놓치고 있는 점을 지적하세요.`,
        `${lastRef}구체적인 숫자나 사례를 들어서 주장을 뒷받침하세요.`,
        `${lastRef}${lastSpeaker}에게 직접 질문을 던지세요.`,
        `${lastRef}"솔직히 말하면..." 으로 시작해서 불편한 진실을 말하세요.`,
      ];
      return tactics[Math.floor(Math.random() * tactics.length)];
    }

    case 'deep': {
      const tactics = [
        `${lastRef}지금까지 논의를 요약하고, 아직 결론이 안 난 핵심 쟁점을 짚으세요.`,
        `${lastRef}완전히 다른 각도에서 생각해보세요. "아예 이런 건 어때요?"`,
        `${lastRef}현실적인 제약을 언급하세요. 시간, 돈, 인력 중 하나.`,
        `${lastRef}${lastSpeaker}의 의견에 조건부 동의하세요. "그건 맞는데, 다만..."`,
        `${lastRef}감정적으로 반응하세요. 지침, 답답함, 흥분 중 하나.`,
      ];
      return tactics[Math.floor(Math.random() * tactics.length)];
    }

    case 'closing': {
      const tactics = [
        `${lastRef}결론을 내리자고 제안하세요. "이쯤에서 정리하면..."`,
        `${lastRef}지금까지 나온 안 중 하나를 강하게 밀어보세요.`,
        `${lastRef}시간이 없다는 뉘앙스를 내세요.`,
        `${lastRef}타협안을 제시하세요.`,
        `${lastRef}"다음 회의에서 다시 논의하자"고 할지, 지금 결정하자고 할지 택하세요.`,
      ];
      return tactics[Math.floor(Math.random() * tactics.length)];
    }
  }
}

function getMoodShift(dialogueLength: number): string {
  if (dialogueLength > 20) return '\n\n(당신은 지금 지쳐있고 빨리 끝내고 싶습니다. 짧고 단호하게.)';
  if (dialogueLength > 15) return '\n\n(회의가 길어지고 있습니다. 약간 피로한 톤.)';
  if (dialogueLength > 10) return '\n\n(논의가 깊어지면서 감정이 들어가기 시작합니다.)';
  return '';
}

function describePersonality(role: Role): string {
  const p = role.personality;
  const traits: string[] = [];

  if (p.assertiveness > 0.7) traits.push('자기 주장이 강함');
  else if (p.assertiveness < 0.4) traits.push('조용하고 차분함');

  if (p.optimism > 0.7) traits.push('낙관적');
  else if (p.optimism < 0.3) traits.push('비관적/현실적');

  if (p.riskTolerance > 0.7) traits.push('도전적');
  else if (p.riskTolerance < 0.3) traits.push('보수적/리스크 회피');

  if (p.creativity > 0.7) traits.push('창의적/엉뚱');
  else if (p.creativity < 0.3) traits.push('원칙적/체계적');

  if (p.empathy > 0.7) traits.push('공감 능력 높음');
  else if (p.empathy < 0.3) traits.push('업무 중심적');

  return traits.join(', ') || '균형 잡힌 성격';
}

function describeLevelBehavior(role: Role): string {
  switch (role.level) {
    case 'executive':
      return '경영진. 큰 그림 위주. 실무 디테일보다 전략과 방향.';
    case 'manager':
      return '중간 관리자. 위아래 눈치 보며 조율. 실행 가능성 중시.';
    case 'senior':
      return '실무 전문가. 경험과 데이터로 말함. 자기 분야에서 자신감.';
    case 'junior':
      return '주니어. 배우는 중. 질문 많이 함. 가끔 핵심 찌름.';
    case 'intern':
      return '인턴. 눈치 없이 솔직함. 근본적 질문. 무시당하기도 함.';
  }
}
