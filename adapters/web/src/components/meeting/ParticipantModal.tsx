import { motion, AnimatePresence } from 'framer-motion';
import type { MeetingParticipant } from '@startup-meeting/types';

interface Props {
  participant: MeetingParticipant | null;
  isUser: boolean;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  executive: 'border-yellow-500 bg-yellow-500/10',
  manager: 'border-blue-500 bg-blue-500/10',
  senior: 'border-green-500 bg-green-500/10',
  junior: 'border-gray-500 bg-gray-500/10',
  intern: 'border-purple-500 bg-purple-500/10',
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

function getApproachTip(p: { assertiveness: number; riskTolerance: number; empathy: number; optimism: number; creativity: number }): string {
  if (p.riskTolerance < 0.3) return 'Tip: 숫자와 데이터로 설득하면 효과적';
  if (p.assertiveness > 0.7) return 'Tip: 정면 반박보다 질문으로 유도하면 열림';
  if (p.empathy > 0.7) return 'Tip: 사람/팀 영향을 언급하면 공감함';
  if (p.optimism < 0.3) return 'Tip: 리스크를 인정한 뒤 대안을 제시하면 먹힘';
  if (p.creativity > 0.7) return 'Tip: 틀에 안 맞는 아이디어도 일단 던져보면 반응함';
  return 'Tip: 논리적으로 접근하면 OK';
}

export default function ParticipantModal({ participant, isUser, onClose }: Props) {
  return (
    <AnimatePresence>
      {participant && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
          >
            <div className={`rounded-2xl border-2 ${LEVEL_COLORS[participant.role.level] ?? 'border-gray-600 bg-gray-800/50'} bg-gray-900 shadow-2xl`}>
              {/* Header */}
              <div className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold shrink-0">
                  {participant.role.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold">
                    {isUser ? `${participant.role.title} (Me)` : participant.role.title}
                  </div>
                  <div className="text-sm text-gray-400">
                    {LEVEL_BADGES[participant.role.level] ?? participant.role.level}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Personality tags */}
                <div className="flex flex-wrap gap-1.5">
                  {describePersonalityShort(participant.role.personality).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Speaking style */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">대화 스타일</div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {participant.role.speakingStyle}
                  </p>
                </div>

                {/* Expertise */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">전문 분야</div>
                  <p className="text-sm text-gray-300">
                    {participant.role.expertise.join(', ')}
                  </p>
                </div>

                {/* Initial stance */}
                {participant.initialStance && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">입장</div>
                    <p className="text-sm text-blue-400 leading-relaxed">
                      "{participant.initialStance}"
                    </p>
                  </div>
                )}

                {/* Approach tip */}
                {!isUser && (
                  <div className="text-sm text-green-400 bg-green-900/20 rounded-lg px-3 py-2">
                    {getApproachTip(participant.role.personality)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
