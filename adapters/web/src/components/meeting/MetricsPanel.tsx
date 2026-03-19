import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  mood: 'calm' | 'tense' | 'heated' | 'chaotic';
  turnCount: number;
  participantCount: number;
}

const MOOD_COLORS: Record<string, string> = {
  calm: 'text-green-400',
  tense: 'text-yellow-400',
  heated: 'text-orange-400',
  chaotic: 'text-red-400',
};

const MOOD_LABELS: Record<string, string> = {
  calm: 'Calm',
  tense: 'Tense',
  heated: 'Heated',
  chaotic: 'Chaotic',
};

export default function MetricsPanel({ isOpen, onToggle, mood, turnCount, participantCount }: Props) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        {isOpen ? 'Hide Stats' : 'Show Stats'}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-gray-800 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Mood</span>
                <span className={MOOD_COLORS[mood]}>{MOOD_LABELS[mood]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Turns</span>
                <span>{turnCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Participants</span>
                <span>{participantCount}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
