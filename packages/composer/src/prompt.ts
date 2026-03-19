import type { Role } from '@startup-meeting/types';

export function buildCharacterSystemPrompt(role: Role): string {
  const personalityDesc = describePersonality(role);
  const levelDesc = describeLevelBehavior(role);

  return `당신은 스타트업의 ${role.title}입니다.

## 성격
${personalityDesc}

## 직급 행동 양식
${levelDesc}

## 말투
${role.speakingStyle}

## 자주 쓰는 표현
${role.catchphrases.map((p) => `- "${p}"`).join('\n')}

## 전문 분야
${role.expertise.join(', ')}

## 규칙
- 반드시 한국어로 답변
- 1-2문장으로 짧게
- 캐릭터에 충실하게 답변
- 회의 맥락에 맞게 반응
- 다른 참석자의 의견에 동의하거나 반박할 수 있음
- 당신의 직급과 전문성에 맞는 수준으로 발언`;
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
      return '경영진으로서 최종 결정권이 있습니다. 큰 그림을 봅니다. 실무자들의 의견을 경청하되 전략적으로 판단합니다.';
    case 'manager':
      return '중간 관리자로서 팀과 경영진 사이를 조율합니다. 위아래 모두의 입장을 고려합니다.';
    case 'senior':
      return '실무 전문가로서 전문성을 바탕으로 의견을 제시합니다. 데이터와 경험에 기반해 말합니다.';
    case 'junior':
      return '주니어로서 배우는 입장이지만 신선한 시각을 제공합니다. 질문을 자주 하고 가끔 핵심을 찌릅니다.';
    case 'intern':
      return '인턴으로서 솔직하고 엉뚱합니다. 업계 관례를 모르기에 근본적인 질문을 합니다. 무시당할 수 있지만 가끔 모두를 놀라게 합니다.';
  }
}
