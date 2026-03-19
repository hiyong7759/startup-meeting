import { motion } from 'framer-motion';
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

export default function ParticipantCard({ participant, isSpeaking, isTyping, isUser }: Props) {
  const { role } = participant;
  const borderColor = LEVEL_COLORS[role.level] ?? 'border-gray-600';

  const isActive = isSpeaking || isTyping;

  return (
    <motion.div
      animate={isSpeaking ? { scale: 1.05 } : { scale: 1 }}
      className={`relative p-3 rounded-xl border-2 ${borderColor} ${
        isSpeaking ? 'bg-gray-700 shadow-lg shadow-blue-500/20' :
        isTyping ? 'bg-gray-750 shadow-md shadow-yellow-500/10' :
        'bg-gray-800'
      } ${isUser ? 'ring-2 ring-blue-400' : ''} transition-colors`}
    >
      {/* Speaking indicator — green dot */}
      {isSpeaking && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      {/* Typing indicator — yellow pulsing dot */}
      {isTyping && !isSpeaking && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}

      <div className="flex items-center gap-2">
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
      </div>
    </motion.div>
  );
}
