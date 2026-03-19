import type { ContextQuestion, MeetingSetup, DynamicAgenda, MeetingParticipant, EvaluationCriterion } from '@startup-meeting/types';
import type { Role } from '@startup-meeting/types';
import { callLlm } from './llm-client';

export async function generateContextQuestions(topic: string): Promise<ContextQuestion[]> {
  const response = await callLlm({
    system: `당신은 스타트업 경영 회의 진행자입니다. 주어진 회의 주제에 대해 맥락을 파악하기 위한 질문 2-3개를 생성하세요.

JSON 배열로만 응답하세요:
[{"id": "q1", "question": "질문내용", "type": "single_choice", "options": ["옵션1", "옵션2", "옵션3"]}]

type은 "single_choice" 또는 "free_text" 중 하나입니다.`,
    userMessage: `회의 주제: "${topic}"`,
    model: 'haiku',
    maxTokens: 512,
  });

  return parseJsonResponse<ContextQuestion[]>(response.text) ?? [];
}

export async function generateMeetingSetup(
  topic: string,
  contextAnswers: ContextQuestion[],
  availableRoles: Role[],
): Promise<MeetingSetup> {
  const contextSummary = contextAnswers
    .map((q) => `Q: ${q.question}\nA: ${q.answer ?? '(미답변)'}`)
    .join('\n');

  const rolePool = availableRoles
    .map((r) => `${r.id}: ${r.title} (${r.department}, ${r.level})`)
    .join('\n');

  const response = await callLlm({
    system: `당신은 스타트업 경영 회의를 구성하는 AI입니다.
주제와 맥락을 분석해서 회의를 구성하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "agenda": {
    "title": "안건 제목",
    "description": "안건 설명 (2-3문장)",
    "category": "카테고리",
    "keyQuestions": ["핵심 질문 1", "핵심 질문 2", "핵심 질문 3"],
    "possibleOutcomes": ["가능한 결과 1", "가능한 결과 2"]
  },
  "participantIds": ["role_id_1", "role_id_2", ...],
  "participantRelevance": {"role_id_1": "이 회의에 참석하는 이유", ...},
  "participantStance": {"role_id_1": "이 주제에 대한 초기 입장", ...},
  "evaluationCriteria": [
    {"id": "c1", "name": "기준명", "description": "설명", "weight": 3}
  ]
}

참석자는 5-7명을 선정하세요. 반드시 제공된 역할 풀에서만 선택하세요.`,
    userMessage: `주제: "${topic}"\n\n맥락:\n${contextSummary}\n\n역할 풀:\n${rolePool}`,
    model: 'sonnet',
    maxTokens: 1024,
  });

  const parsed = parseJsonResponse<{
    agenda: DynamicAgenda;
    participantIds: string[];
    participantRelevance: Record<string, string>;
    participantStance: Record<string, string>;
    evaluationCriteria: EvaluationCriterion[];
  }>(response.text);

  if (!parsed) {
    throw new Error('Failed to parse meeting setup from LLM response');
  }

  const participants: MeetingParticipant[] = parsed.participantIds
    .map((id) => {
      const role = availableRoles.find((r) => r.id === id);
      if (!role) return null;
      return {
        role,
        relevance: parsed.participantRelevance[id] ?? '',
        initialStance: parsed.participantStance[id] ?? '',
      };
    })
    .filter((p): p is MeetingParticipant => p !== null);

  return {
    topic,
    context: contextAnswers,
    agenda: parsed.agenda,
    participants,
    evaluationCriteria: parsed.evaluationCriteria,
  };
}

function parseJsonResponse<T>(text: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks or raw text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch?.[1]) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }
    return JSON.parse(text.trim()) as T;
  } catch {
    return null;
  }
}
