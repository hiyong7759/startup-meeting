import type { EvaluationReport } from '@startup-meeting/types';
import type { MeetingSetup } from '@startup-meeting/types';

export function generatePlanFile(
  setup: MeetingSetup,
  evaluation: EvaluationReport,
): string {
  const { meetingMinutes } = evaluation;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const lines: string[] = [
    `# PLAN-${date}-MEETING`,
    '',
    `## Goal`,
    setup.topic,
    '',
    `## Context (회의에서 도출)`,
    ...setup.context
      .filter((q) => q.answer)
      .map((q) => `- ${q.question}: ${q.answer}`),
    '',
    `## Participants`,
    ...setup.participants.map((p) => `- ${p.role.title}: ${p.relevance}`),
    '',
    `## Key Discussion Points`,
    ...meetingMinutes.keyDiscussionPoints.map(
      (dp) => `- **${dp.speaker}**: ${dp.summary} (${dp.reaction})`,
    ),
    '',
    `## Decisions`,
    ...meetingMinutes.decisions.map((d, i) => `${i + 1}. ${d}`),
    '',
    `## Action Items`,
    ...meetingMinutes.actionItems.map(
      (ai) => `- [ ] ${ai.description} (${ai.owner}, ${ai.priority})`,
    ),
    '',
    `## Dissenting Views`,
    ...meetingMinutes.dissent.map((d) => `- ${d}`),
    '',
    `## Evaluation`,
    `- Overall Grade: ${evaluation.overallGrade} (${evaluation.overallScore}/25)`,
    `- Perspectives Missed: ${evaluation.perspectivesMissed.map((p) => p.perspective).join(', ') || 'None'}`,
    '',
    `## Predicted Outcomes`,
    ...evaluation.predictedOutcomes.map(
      (po) => `- ${po.timeframe}: ${po.description} (${Math.round(po.probability * 100)}%, risk: ${po.risk})`,
    ),
  ];

  return lines.join('\n');
}

export function copyToClipboard(text: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      fallbackCopy(text);
    });
  }
}

function fallbackCopy(text: string): void {
  if (typeof document === 'undefined') return;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function downloadAsFile(text: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
