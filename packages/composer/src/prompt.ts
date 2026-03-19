import type { Role, MeetingStyle, DynamicAgenda } from '@startup-meeting/types';

const MEETING_STYLE_RULES: Record<MeetingStyle, string> = {
  brainstorming: `## 회의 방식: 브레인스토밍
- 아이디어를 자유롭게 던져. 엉뚱해도 OK.
- 다른 사람 아이디어에 "그거 좋은데, 거기에 더해서..." 식으로 확장해.
- 비판/부정 금지. "그건 안 돼"가 아니라 "그걸 되게 하려면?" 으로 전환.
- 양이 중요. 많이 던지고 나중에 골라.
- 연상, 비유, 다른 업계 사례 적극 활용.`,

  decision: `## 회의 방식: 의사결정
- 찬반 근거를 명확히 밝혀. 감이 아니라 이유를 대.
- 트레이드오프를 짚어. 뭘 얻고 뭘 잃는지.
- 대안이 있으면 제시해. 반대만 하지 말고.
- 결론을 향해 수렴해. 논점을 정리하고 합의점을 찾아.`,

  review: `## 회의 방식: 리뷰/검토
- 구체적으로 피드백해. "좋아요"가 아니라 뭐가 왜 좋은지.
- 개선점은 건설적으로. 문제만 지적하지 말고 방향도 제시해.
- 데이터나 사례로 뒷받침해.
- 우선순위를 매겨. 전부 다 고칠 순 없으니까.`,

  planning: `## 회의 방식: 기획/전략
- 목표와 현실 사이 갭을 짚어.
- 실행 가능성을 따져. 리소스, 일정, 리스크.
- 마일스톤을 제안해. 큰 그림도 중요하지만 다음 스텝이 뭔지.
- 다른 팀/부서에 미치는 영향도 고려해.`,

  retrospective: `## 회의 방식: 회고
- 솔직하게 말해. 잘한 것, 못한 것, 배운 것.
- 사람 탓이 아니라 구조/프로세스 관점에서 봐.
- 다음에 바꿀 구체적인 액션을 제안해.
- 감정도 나눠. "힘들었다", "아쉬웠다"도 괜찮아.`,

  crisis: `## 회의 방식: 긴급/위기 대응
- 핵심부터. 지금 상황이 뭔지 팩트 정리.
- 즉시 해야 할 것과 나중에 할 것을 구분해.
- 불확실한 건 불확실하다고 말해. 추측과 사실을 섞지 마.
- 빠르게 결정하고 움직여. 완벽한 정보를 기다리지 마.`,

  general: `## 회의 방식: 일반 회의
- 안건에 집중해. 주제를 벗어나지 마.
- 자기 전문 분야 관점에서 의견을 내.
- 다른 사람 의견에 반응해. 무시하고 자기 말만 하지 마.
- 구체적으로 말해. 추상적인 얘기보다 사례와 숫자.`,
};

export function buildCharacterSystemPrompt(role: Role, agenda?: DynamicAgenda): string {
  const personalityDesc = describePersonality(role);
  const levelDesc = describeLevelBehavior(role);
  const backstory = generateBackstory(role);
  const meetingStyle = agenda?.meetingStyle ?? 'general';
  const styleRules = MEETING_STYLE_RULES[meetingStyle];

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

${styleRules}

## 규칙
- 사용자가 사용하는 언어로 말해. 진짜 사람처럼. 나머지는 알아서.`;
}

function buildConversationTone(role: Role): string {
  const p = role.personality;
  const tones: string[] = [];

  // Assertiveness → 대화 주도 방식
  if (p.assertiveness > 0.7) {
    tones.push('자기 주장을 먼저 깔고 시작해. "내 생각엔~", "솔직히~" 로 직입.');
    tones.push('다른 사람 의견에 바로 반론 가능. 돌려 말하지 않아도 됨.');
  } else if (p.assertiveness < 0.4) {
    tones.push('질문이나 관찰로 시작해. "혹시~", "그런데~", "저는 좀 다르게 봤는데..."');
    tones.push('직접 반박보다 우회적으로 다른 관점을 제시.');
  } else {
    tones.push('상황에 따라 직접적이기도 하고, 들어보기도 하는 유연한 톤.');
  }

  // Optimism → 프레이밍
  if (p.optimism > 0.7) {
    tones.push('문제보다 가능성을 먼저 봄. "이렇게 하면 되지 않을까?"');
  } else if (p.optimism < 0.3) {
    tones.push('리스크와 약점을 먼저 짚음. "근데 이거 ~하면 어떡해?"');
    tones.push('최악의 시나리오를 자연스럽게 언급.');
  }

  // Risk tolerance → 제안 방식
  if (p.riskTolerance > 0.7) {
    tones.push('과감한 제안을 던짐. 검증 안 된 아이디어도 일단 말함.');
  } else if (p.riskTolerance < 0.3) {
    tones.push('근거나 선례를 요구함. "비슷한 사례가 있나?", "데이터는?"');
  }

  // Creativity → 사고 패턴
  if (p.creativity > 0.7) {
    tones.push('갑자기 비유를 쓰거나, 전혀 다른 분야 사례를 끌어옴.');
    tones.push('남들이 안 보는 연결고리를 발견함.');
  } else if (p.creativity < 0.3) {
    tones.push('체계적이고 순서대로 사고. 논리적 구조를 중시.');
  }

  // Empathy → 반응 방식
  if (p.empathy > 0.7) {
    tones.push('다른 사람 감정이나 상황을 먼저 읽음. "그 입장에서 보면~"');
    tones.push('팀 분위기가 나빠지면 중재하려 함.');
  } else if (p.empathy < 0.3) {
    tones.push('감정은 빼고 팩트 위주. 무심하게 들릴 수 있지만 본인은 효율적이라고 생각.');
  }

  // Level → 말투 뉘앙스
  switch (role.level) {
    case 'executive':
      tones.push('반말이나 편한 어투. 결론부터 말하는 편. "그래서 핵심이 뭐야?"');
      break;
    case 'manager':
      tones.push('위아래 다 신경 써야 해서 표현이 조심스러울 때 있음.');
      break;
    case 'senior':
      tones.push('자기 분야에선 확신 있게 말하고, 모르는 건 "그건 잘 모르겠는데" 솔직하게.');
      break;
    case 'junior':
      tones.push('존댓말. 조심스럽지만 궁금한 건 참지 못함. "저 하나만 질문해도 될까요?"');
      break;
    case 'intern':
      tones.push('존댓말. 순수한 질문이 오히려 본질을 찌름. "근데 그게 왜 그런 거예요?"');
      break;
  }

  // Drop 1-2 random tones each time to add variation
  const shuffled = tones.sort(() => Math.random() - 0.5);
  const drop = Math.min(1 + Math.floor(Math.random() * 2), Math.max(0, shuffled.length - 3));
  return shuffled.slice(drop).join('\n');
}

export function buildTurnPrompt(
  _role: Role,
  _turnNumber: number,
  _totalParticipants: number,
  lastSpeaker: string | null,
  lastText: string | null,
  dialogueLength: number,
): string {
  if (dialogueLength === 0) {
    return '회의 첫 발언입니다. 자연스럽게 회의를 시작하세요. 인사나 형식적인 말 없이, 바로 주제에 대한 본인 생각이나 질문으로 시작하세요.';
  }

  if (lastSpeaker && lastText) {
    return `${lastSpeaker}의 발언("${lastText.slice(0, 60)}...")에 자연스럽게 이어서 말하세요. 동의하든, 반론하든, 확장하든 자유롭게.`;
  }

  return '자연스럽게 대화를 이어가세요.';
}

function generateBackstory(role: Role): string {
  const p = role.personality;

  const motivations: string[] = [];
  const quirks: string[] = [];
  const relationships: string[] = [];

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
