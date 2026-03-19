import type {
  EvaluationReport,
  Grade,
  CriterionScore,
  PerspectiveMissed,
  PredictedOutcome,
  AlternativeRoleAnalysis,
  MeetingMinutes,
  DiscussionPoint,
  ActionItem,
  EvaluationCriterion,
} from '@startup-meeting/types';
import type { MeetingParticipant, Role } from '@startup-meeting/types';
import type { DialogueEntry } from './meeting-llm';
import { callLlm } from './llm-client';

export async function generateEvaluation(
  meetingId: string,
  topic: string,
  userRole: Role,
  participants: MeetingParticipant[],
  dialogue: DialogueEntry[],
  criteria: EvaluationCriterion[],
): Promise<EvaluationReport> {
  const dialogueText = dialogue
    .map((d) => `${d.speaker}(${d.role}): ${d.text}`)
    .join('\n');

  const criteriaText = criteria
    .map((c) => `- ${c.name} (가중치 ${c.weight}): ${c.description}`)
    .join('\n');

  const participantList = participants
    .map((p) => `${p.role.title} (${p.role.department}, ${p.role.level})`)
    .join(', ');

  const response = await callLlm({
    system: `당신은 회의 평가 전문가입니다. 회의 내용을 분석하고 유저의 역할 수행을 평가하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "overallGrade": "S|A|B|C|D",
  "overallScore": 0-25,
  "criteriaScores": [{"criterionId": "c1", "score": 1-5, "comment": "평가 코멘트"}],
  "perspectivesShown": ["유저가 제시한 관점들"],
  "perspectivesMissed": [{"perspective": "놓친 관점", "whoseView": "누구의 관점", "impact": "critical|important|minor", "explanation": "설명"}],
  "predictedOutcomes": [{"timeframe": "short|medium|long", "description": "예상 결과", "probability": 0.0-1.0, "risk": "리스크"}],
  "alternativeRoles": [{"roleTitle": "역할명", "wouldHaveDone": "이 역할이었다면", "likelyOutcome": "예상 결과"}],
  "minutes": {
    "keyPoints": [{"speaker": "발언자", "summary": "요약", "reaction": "agreed|debated|opposed"}],
    "decisions": ["결정사항"],
    "actionItems": [{"description": "할일", "owner": "담당자", "priority": "high|medium|low"}],
    "dissent": ["반대 의견"]
  }
}`,
    userMessage: `주제: ${topic}
유저 역할: ${userRole.title} (${userRole.level})
참석자: ${participantList}

평가 기준:
${criteriaText}

전체 대화:
${dialogueText}`,
    model: 'sonnet',
    maxTokens: 2048,
  });

  const parsed = parseEvaluationResponse(response.text);

  const meetingMinutes: MeetingMinutes = {
    topic,
    date: new Date().toISOString(),
    participants: participants.map((p) => p.role.title),
    keyDiscussionPoints: (parsed.minutes as { keyPoints?: Array<{ speaker: string; summary: string; reaction: string }> })?.keyPoints?.map((kp): DiscussionPoint => ({
      speaker: kp.speaker,
      summary: kp.summary,
      reaction: kp.reaction as DiscussionPoint['reaction'],
    })) ?? [],
    decisions: (parsed.minutes as { decisions?: string[] })?.decisions ?? [],
    actionItems: (parsed.minutes as { actionItems?: Array<{ description: string; owner: string; priority: string }> })?.actionItems?.map((ai): ActionItem => ({
      description: ai.description,
      owner: ai.owner,
      priority: ai.priority as ActionItem['priority'],
    })) ?? [],
    dissent: (parsed.minutes as { dissent?: string[] })?.dissent ?? [],
  };

  const criteriaScores: CriterionScore[] = ((parsed.criteriaScores as Array<{ criterionId: string; score: number; comment: string }>) ?? []).map((cs) => {
    const criterion = criteria.find((c) => c.id === cs.criterionId) ?? {
      id: cs.criterionId,
      name: cs.criterionId,
      description: '',
      weight: 1,
    };
    return { criterion, score: cs.score, comment: cs.comment };
  });

  return {
    meetingId,
    overallGrade: ((parsed.overallGrade as string) ?? 'C') as Grade,
    overallScore: (parsed.overallScore as number) ?? 12,
    criteriaScores,
    perspectivesShown: (parsed.perspectivesShown as string[]) ?? [],
    perspectivesMissed: (parsed.perspectivesMissed as PerspectiveMissed[]) ?? [],
    predictedOutcomes: (parsed.predictedOutcomes as PredictedOutcome[]) ?? [],
    alternativeRoles: (parsed.alternativeRoles as AlternativeRoleAnalysis[]) ?? [],
    meetingMinutes,
  };
}

function parseEvaluationResponse(text: string): Record<string, unknown> {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (jsonMatch?.[1]) {
      return JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
    }
    return JSON.parse(text.trim()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
