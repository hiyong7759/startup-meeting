import { useState, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectTerms, explainTerm } from '@startup-meeting/composer';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  text: string;
}

export default function TermTooltip({ text }: Props) {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const topic = useGameStore((s) => s.meetingSetup?.topic ?? '');

  const terms = detectTerms(text);

  const handleTermClick = useCallback(async (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.bottom + 4 });

    if (activeTerm === term) {
      setActiveTerm(null);
      setExplanation(null);
      return;
    }

    setActiveTerm(term);
    setExplanation(null);
    setLoading(true);

    try {
      const result = await explainTerm(term, topic);
      setExplanation(result);
    } catch {
      setExplanation('설명을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTerm, topic]);

  const handleDismiss = useCallback(() => {
    setActiveTerm(null);
    setExplanation(null);
  }, []);

  // No terms detected — render plain text
  if (terms.length === 0) return <>{text}</>;

  // Split text into segments with highlighted terms
  const segments: Array<{ text: string; isTerm: boolean }> = [];
  let lastIndex = 0;

  for (const term of terms) {
    if (term.start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, term.start), isTerm: false });
    }
    segments.push({ text: term.term, isTerm: true });
    lastIndex = term.end;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isTerm: false });
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.isTerm ? (
          <span
            key={i}
            onClick={(e) => handleTermClick(seg.text, e)}
            className="underline decoration-dotted decoration-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
          >
            {seg.text}
          </span>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}

      <AnimatePresence>
        {activeTerm && (
          <>
            <div className="fixed inset-0 z-40" onClick={handleDismiss} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="fixed z-50 w-72 p-3 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl"
              style={{ left: Math.min(position.x, window.innerWidth - 300), top: position.y }}
            >
              <div className="text-xs text-blue-400 font-semibold mb-1">{activeTerm}</div>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <motion.span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                  설명 로딩중...
                </div>
              ) : (
                <p className="text-xs text-gray-300 leading-relaxed">{explanation}</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
