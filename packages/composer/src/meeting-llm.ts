import type { CharacterUtterance, CharacterId } from '@startup-meeting/types';
import type { Role, DynamicAgenda, MeetingParticipant } from '@startup-meeting/types';
import { callLlm, callLlmStream } from './llm-client';
import { buildCharacterSystemPrompt } from './prompt';

export interface MeetingContext {
  agenda: DynamicAgenda;
  participants: MeetingParticipant[];
  dialogueHistory: DialogueEntry[];
  currentEvent?: string;
  userRole: Role;
}

export interface DialogueEntry {
  speaker: string;
  role: string;
  text: string;
}

export async function generateCharacterUtterance(
  participant: MeetingParticipant,
  context: MeetingContext,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role);

  const historyText = context.dialogueHistory
    .slice(-8)
    .map((d) => `${d.speaker}(${d.role}): ${d.text}`)
    .join('\n');

  let userMessage = `회의 안건: ${context.agenda.title}\n${context.agenda.description}\n\n`;

  if (historyText) {
    userMessage += `최근 대화:\n${historyText}\n\n`;
  }

  if (context.currentEvent) {
    userMessage += `⚡ 방금 발생한 이벤트: ${context.currentEvent}\n\n`;
  }

  userMessage += `당신의 초기 입장: ${participant.initialStance}\n`;
  userMessage += `1-2문장으로 의견을 말하세요.`;

  const response = await callLlm({
    system: systemPrompt,
    userMessage,
    model: 'haiku',
    maxTokens: 200,
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
  const systemPrompt = buildCharacterSystemPrompt(participant.role);

  const historyText = context.dialogueHistory
    .slice(-5)
    .map((d) => `${d.speaker}(${d.role}): ${d.text}`)
    .join('\n');

  const prompt = `회의 안건: ${context.agenda.title}\n\n최근 대화:\n${historyText}\n\n${context.userRole.title}(유저)이 방금 말했습니다: "${userMessage}"\n\n이에 대해 1-2문장으로 반응하세요. 당신의 역할과 관점에서 반응하세요.`;

  const response = await callLlm({
    system: systemPrompt,
    userMessage: prompt,
    model: 'haiku',
    maxTokens: 200,
  });

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: 'decision_reaction',
    emotion: inferEmotion(response.text),
  };
}

// Streaming version: calls onChunk with each text fragment as it arrives
export async function streamCharacterUtterance(
  participant: MeetingParticipant,
  context: MeetingContext,
  onChunk: (chunk: string) => void,
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role);

  const historyText = context.dialogueHistory
    .slice(-8)
    .map((d) => `${d.speaker}(${d.role}): ${d.text}`)
    .join('\n');

  let userMessage = `회의 안건: ${context.agenda.title}\n${context.agenda.description}\n\n`;
  if (historyText) userMessage += `최근 대화:\n${historyText}\n\n`;
  if (context.currentEvent) userMessage += `방금 발생한 이벤트: ${context.currentEvent}\n\n`;
  userMessage += `당신의 초기 입장: ${participant.initialStance}\n`;
  userMessage += `1-2문장으로 의견을 말하세요.`;

  const response = await callLlmStream(
    { system: systemPrompt, userMessage, model: 'haiku', maxTokens: 200 },
    onChunk,
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
): Promise<CharacterUtterance> {
  const systemPrompt = buildCharacterSystemPrompt(participant.role);

  const historyText = context.dialogueHistory
    .slice(-5)
    .map((d) => `${d.speaker}(${d.role}): ${d.text}`)
    .join('\n');

  const prompt = `회의 안건: ${context.agenda.title}\n\n최근 대화:\n${historyText}\n\n${context.userRole.title}(유저)이 방금 말했습니다: "${userMsg}"\n\n이에 대해 1-2문장으로 반응하세요.`;

  const response = await callLlmStream(
    { system: systemPrompt, userMessage: prompt, model: 'haiku', maxTokens: 200 },
    onChunk,
  );

  return {
    characterId: participant.role.id as CharacterId,
    characterName: participant.role.title,
    text: response.text.trim(),
    type: 'decision_reaction',
    emotion: inferEmotion(response.text),
  };
}

function inferEmotion(text: string): CharacterUtterance['emotion'] {
  if (/좋|동의|찬성|맞|그래|훌륭/.test(text)) return 'positive';
  if (/반대|안 돼|위험|문제|걱정|심각/.test(text)) return 'negative';
  if (/헐|진짜|뭐|갑자기|세상에/.test(text)) return 'surprised';
  if (/아니|왜|도대체|짜증|한숨/.test(text)) return 'frustrated';
  if (/와|대박|기대|신나|좋겠/.test(text)) return 'excited';
  return 'neutral';
}
