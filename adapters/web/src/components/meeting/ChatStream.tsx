import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatStream() {
  const dialogue = useGameStore((s) => s.dialogue);
  const userRole = useGameStore((s) => s.userRole);
  const streamingText = useGameStore((s) => s.streamingText);
  const streamingSpeaker = useGameStore((s) => s.streamingSpeaker);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue, streamingText]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <AnimatePresence>
        {dialogue.map((entry, i) => {
          const isUser = entry.role === userRole?.title;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div className="text-xs text-gray-400 mb-1">
                  {entry.speaker}
                </div>
                <div
                  className={`inline-block px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Streaming: show partial text as it arrives */}
      {streamingSpeaker && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="max-w-[80%]">
            <div className="text-xs text-gray-400 mb-1">
              {streamingSpeaker}
            </div>
            <div className="inline-block px-4 py-2 bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
              {streamingText || (
                <span className="inline-flex items-center gap-1">
                  <motion.span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.12 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.24 }}
                  />
                </span>
              )}
              {streamingText && (
                <motion.span
                  className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
