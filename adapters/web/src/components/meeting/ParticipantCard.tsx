import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MeetingParticipant } from '@startup-meeting/types';

interface Props {
  participant: MeetingParticipant;
  isSpeaking: boolean;
  isTyping: boolean;
  isUser: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  executive: 'border-yellow-500',
  manager: 'border-blue-500',
  senior: 'border-green-500',
  junior: 'border-gray-500',
  intern: 'border-purple-500',
};

const LEVEL_BADGES: Record<string, string> = {
  executive: 'C-Level',
  manager: 'Manager',
  senior: 'Senior',
  junior: 'Junior',
  intern: 'Intern',
};

function describePersonalityShort(p: { assertiveness: number; optimism: number; riskTolerance: number; creativity: number; empathy: number }): string[] {
  const tags: string[] = [];
  if (p.assertiveness > 0.7) tags.push('주장 강함');
  else if (p.assertiveness < 0.4) tags.push('차분함');
  if (p.optimism > 0.7) tags.push('낙관적');
  else if (p.optimism < 0.3) tags.push('현실적');
  if (p.riskTolerance > 0.7) tags.push('도전적');
  else if (p.riskTolerance < 0.3) tags.push('신중함');
  if (p.creativity > 0.7) tags.push('창의적');
  if (p.empathy > 0.7) tags.push('공감력');
  else if (p.empathy < 0.3) tags.push('업무 중심');
  return tags;
}

function getApproachTip(p: { assertiveness: number; riskTolerance: number; empathy: number; optimism: number }): string {
  if (p.riskTolerance < 0.3) return 'Tip: 숫자와 데이터로 설득하면 효과적';
  if (p.assertiveness > 0.7) return 'Tip: 정면 반박보다 질문으로 유도하면 열림';
  if (p.empathy > 0.7) return 'Tip: 사람/팀 영향을 언급하면 공감함';
  if (p.optimism < 0.3) return 'Tip: 리스크를 인정한 뒤 대안을 제시하면 먹힘';
  if (p.creativity > 0.7) return 'Tip: 틀에 안 맞는 아이디어도 일단 던져보면 반응함';
  return 'Tip: 논리적으로 접근하면 OK';
}

export default function ParticipantCard({ participant, isSpeaking, isTyping, isUser }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { role } = participant;
  const borderColor = LEVEL_COLORS[role.level] ?? 'border-gray-600';
  const isActive = isSpeaking || isTyping;
  const personalityTags = describePersonalityShort(role.personality);
  const approachTip = getApproachTip(role.personality);

  return (
    <motion.div
      animate={isSpeaking ? { scale: 1.05 } : { scale: 1 }}
      className={`relative rounded-xl border-2 ${borderColor} ${
        isSpeaking ? 'bg-gray-700 shadow-lg shadow-blue-500/20' :
        isTyping ? 'bg-gray-750 shadow-md shadow-yellow-500/10' :
        'bg-gray-800'
      } ${isUser ? 'ring-2 ring-blue-400' : ''} transition-colors cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      {isSpeaking && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      {isTyping && !isSpeaking && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}

      {/* Header — always visible */}
      <div className="p-3 flex items-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
          isActive ? 'bg-gray-500' : 'bg-gray-600'
        }`}>
          {role.title.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {isUser ? `${role.title} (Me)` : role.title}
          </div>
          <div className="text-xs text-gray-400">
            {isTyping && !isSpeaking ? (
              <motion.span
                className="text-yellow-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                typing...
              </motion.span>
            ) : (
              LEVEL_BADGES[role.level] ?? role.level
            )}
          </div>
        </div>
        <div className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</div>
      </div>

      {/* Detail panel — on click */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-gray-700 pt-2">
              {/* Personality tags */}
              <div className="flex flex-wrap gap-1">
                {personalityTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-700 rounded-full text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Speaking style */}
              <p className="text-[11px] text-gray-400 leading-snug">
                {role.speakingStyle}
              </p>

              {/* Expertise */}
              <div className="text-[10px] text-gray-500">
                전문: {role.expertise.join(', ')}
              </div>

              {/* Initial stance for this meeting */}
              {participant.initialStance && (
                <div className="text-[11px] text-blue-400 leading-snug">
                  입장: "{participant.initialStance}"
                </div>
              )}

              {/* Approach tip */}
              {!isUser && (
                <div className="text-[10px] text-green-400 bg-green-900/20 rounded px-2 py-1">
                  {approachTip}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
