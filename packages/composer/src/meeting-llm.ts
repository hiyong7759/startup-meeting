import type { CharacterUtterance, CharacterId } from '@startup-meeting/types';
import type { Role, DynamicAgenda, MeetingParticipant } from '@startup-meeting/types';
import { callLlm, callLlmStream } from './llm-client';
import { buildCharacterSystemPrompt, buildTurnPrompt } from './prompt';

export interface MeetingContext {
  agenda: DynamicAgenda;
  participants: MeetingParticipant[];
  dialogueHistory: DialogueEntry[];
  currentEvent?: string;
  userRole: Role;
  topicContext?: string; // user's context answers summarized
}

export interface DialogueEntry {
  speaker: string;
  role: string;
  text: string;
}

// Per-character conversation memory
// Key: role.id, Value: full dialogue from that character's perspective
const characterSessions = new Map<string, DialogueEntry[]>();

export function resetCharacterSessions(): void {
  characterSessions.clear();
}

// Build the full history from this character's perspective
function buildFullHistory(characterId: string, allDialogue: DialogueEntry[]): string {
  if (allDialogue.length === 0) return '';
  const relevant = allDialogue.slice(-30);
  return relevant.map((d) => `${d.speaker}: ${d.text}`).join('\n');
}

function getLastSpeakerInfo(dialogue: DialogueEntry[]): { speaker: string | null; text: string | null } {
  const last = dialogue[dialogue.length - 1];
  return { speaker: last?.speaker ?? null, text: last?.text ?? null };
}

export async function generateCharacterUtterance(
  participant: MeetingParticipant,
  context: MeetingContext,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role, context.agenda);
  const historyText = buildFullHistory(participant.role.id, context.dialogueHistory);
  const { speaker: lastSpeaker, text: lastText } = getLastSpeakerInfo(context.dialogueHistory);

  const turnPrompt = buildTurnPrompt(
    participant.role,
    context.dialogueHistory.length,
    context.participants.length,
    lastSpeaker,
    lastText,
    context.dialogueHistory.length,
  );

  const lastUserEntry = [...context.dialogueHistory].reverse().find(
    (d) => d.role === context.userRole.title,
  );

  let userMessage = `회의 안건: ${context.agenda.title}\n${context.agenda.description}\n\n`;
  if (context.topicContext) userMessage += `배경 맥락:\n${context.topicContext}\n\n`;
  if (historyText) userMessage += `지금까지 대화:\n${historyText}\n\n`;
  if (context.currentEvent) userMessage += `방금 발생한 이벤트: ${context.currentEvent}\n\n`;
  if (lastUserEntry) {
    userMessage += `★ ${context.userRole.title}(대표)가 방금 말함: "${lastUserEntry.text}"\n이 발언에 반응하거나 이어서 말하세요.\n\n`;
  }
  userMessage += `당신의 기본 입장: ${participant.initialStance}\n\n`;
  userMessage += `[지시] ${turnPrompt}`;

  const response = await callLlm({
    system: systemPrompt,
    userMessage,
    model: 'sonnet',
    maxTokens: 300,
  });

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: context.currentEvent ? 'event_reaction' : 'opinion',
    emotion: inferEmotion(response.text),
  };
}

export async function generateReactionToUser(
  participant: MeetingParticipant,
  userMessage: string,
  context: MeetingContext,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role, context.agenda);
  const historyText = buildFullHistory(participant.role.id, context.dialogueHistory);

  const { speaker: lastSpeaker, text: lastText } = getLastSpeakerInfo(context.dialogueHistory);
  const turnPrompt = buildTurnPrompt(
    participant.role,
    context.dialogueHistory.length,
    context.participants.length,
    lastSpeaker,
    lastText,
    context.dialogueHistory.length,
  );

  let prompt = `회의 안건: ${context.agenda.title}\n\n`;
  if (historyText) prompt += `지금까지 대화:\n${historyText}\n\n`;
  prompt += `${context.userRole.title}이(가) 방금: "${userMessage}"\n\n`;
  prompt += `[지시] ${turnPrompt}`;

  const response = await callLlm({
    system: systemPrompt,
    userMessage: prompt,
    model: 'sonnet',
    maxTokens: 300,
  });

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: 'decision_reaction',
    emotion: inferEmotion(response.text),
  };
}

export async function streamCharacterUtterance(
  participant: MeetingParticipant,
  context: MeetingContext,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role, context.agenda);
  const historyText = buildFullHistory(participant.role.id, context.dialogueHistory);
  const { speaker: lastSpeaker, text: lastText } = getLastSpeakerInfo(context.dialogueHistory);

  const turnPrompt = buildTurnPrompt(
    participant.role,
    context.dialogueHistory.length,
    context.participants.length,
    lastSpeaker,
    lastText,
    context.dialogueHistory.length,
  );

  const lastUserEntry = [...context.dialogueHistory].reverse().find(
    (d) => d.role === context.userRole.title,
  );

  let userMessage = `회의 안건: ${context.agenda.title}\n${context.agenda.description}\n\n`;
  if (context.topicContext) userMessage += `배경 맥락:\n${context.topicContext}\n\n`;
  if (historyText) userMessage += `지금까지 대화:\n${historyText}\n\n`;
  if (context.currentEvent) userMessage += `방금 발생한 이벤트: ${context.currentEvent}\n\n`;
  if (lastUserEntry) {
    userMessage += `★ ${context.userRole.title}(대표)가 방금 말함: "${lastUserEntry.text}"\n이 발언에 반응하거나 이어서 말하세요.\n\n`;
  }
  userMessage += `당신의 기본 입장: ${participant.initialStance}\n\n`;
  userMessage += `[지시] ${turnPrompt}`;

  const response = await callLlmStream(
    { system: systemPrompt, userMessage, model: 'sonnet', maxTokens: 300 },
    onChunk,
    signal,
  );

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: context.currentEvent ? 'event_reaction' : 'opinion',
    emotion: inferEmotion(response.text),
  };
}

export async function streamReactionToUser(
  participant: MeetingParticipant,
  userMsg: string,
  context: MeetingContext,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role, context.agenda);
  const historyText = buildFullHistory(participant.role.id, context.dialogueHistory);
  const { speaker: lastSpeaker, text: lastText } = getLastSpeakerInfo(context.dialogueHistory);

  const turnPrompt = buildTurnPrompt(
    participant.role,
    context.dialogueHistory.length,
    context.participants.length,
    lastSpeaker,
    lastText,
    context.dialogueHistory.length,
  );

  let prompt = `회의 안건: ${context.agenda.title}\n\n`;
  if (historyText) prompt += `지금까지 대화:\n${historyText}\n\n`;
  prompt += `${context.userRole.title}이(가) 방금: "${userMsg}"\n\n`;
  prompt += `[지시] ${turnPrompt}`;

  const response = await callLlmStream(
    { system: systemPrompt, userMessage: prompt, model: 'sonnet', maxTokens: 300 },
    onChunk,
    signal,
  );

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: 'decision_reaction',
    emotion: inferEmotion(response.text),
  };
}

// Detect terms that might need explanation
export function detectTerms(text: string): Array<{ term: string; start: number; end: number }> {
  const terms: Array<{ term: string; start: number; end: number }> = [];
  const patterns = [
    /MRR|ARR|ARPU|CAC|LTV|ROI|PMF|TAM|SAM|SOM|EBITDA|P&L|BEP|GM|NPS/g,
    /런웨이|번레이트|시리즈[A-Z]|프리[A-Z]|벨류에이션|엑시트|IPO|M&A/g,
    /유닛이코노믹스|코호트|리텐션|퍼널|컨버전|온보딩|DAU|MAU|WAU/g,
    /MSA|모놀리식|마이크로서비스|CI\/CD|DevOps|SRE|SLA|SLO|SLI/g,
    /스케일아웃|스케일업|레이턴시|쓰루풋|카나리|블루그린|롤백/g,
    /OKR|KPI|스프린트|애자일|스크럼|칸반|레트로|스탠드업/g,
    /CPC|CPM|CPA|CPL|ROAS|CTR|CVR|SEO|SEM|퍼포먼스마케팅/g,
    /리퍼럴|바이럴|오가닉|페이드|브랜딩|GTM|PLG/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      terms.push({
        term: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  const seen = new Set<string>();
  return terms
    .filter((t) => {
      if (seen.has(`${t.start}-${t.term}`)) return false;
      seen.add(`${t.start}-${t.term}`);
      return true;
    })
    .sort((a, b) => a.start - b.start);
}

// Get explanation for a term via LLM
export async function explainTerm(term: string, meetingContext: string): Promise<string> {
  const response = await callLlm({
    system: '비즈니스/기술 용어를 설명하는 전문가입니다. 짧고 쉽게 설명하세요.',
    userMessage: `"${term}"을(를) 한국어로 2-3문장으로 쉽게 설명해주세요.\n\n회의 맥락: ${meetingContext}`,
    model: 'sonnet',
    maxTokens: 300,
  });
  return response.text.trim();
}

function inferEmotion(text: string): CharacterUtterance['emotion'] {
  if (/좋|동의|찬성|맞|그래|훌륭/.test(text)) return 'positive';
  if (/반대|안 돼|위험|문제|걱정|심각/.test(text)) return 'negative';
  if (/헐|진짜|뭐|갑자기|세상에/.test(text)) return 'surprised';
  if (/아니|왜|도대체|짜증|한숨/.test(text)) return 'frustrated';
  if (/와|대박|기대|신나|좋겠/.test(text)) return 'excited';
  return 'neutral';
}
