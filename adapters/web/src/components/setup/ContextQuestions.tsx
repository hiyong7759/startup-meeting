import { useState } from 'react';
import type { ContextQuestion } from '@startup-meeting/types';

interface Props {
  questions: ContextQuestion[];
  onComplete: (answered: ContextQuestion[]) => void;
}

export default function ContextQuestions({ questions, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const current = questions[currentIdx];
  if (!current) return null;

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [current.id]: answer };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // All answered
      const answered = questions.map((q) => ({
        ...q,
        answer: newAnswers[q.id] ?? '',
      }));
      onComplete(answered);
    }
  };

  const [freeText, setFreeText] = useState('');

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">
        Question {currentIdx + 1} / {questions.length}
      </div>
      <p className="text-lg font-semibold">{current.question}</p>

      {current.type === 'single_choice' && current.options ? (
        <div className="space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-lg transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && freeText.trim()) {
                handleAnswer(freeText.trim());
                setFreeText('');
              }
            }}
            placeholder="Type your answer..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
          />
          <button
            onClick={() => {
              if (freeText.trim()) {
                handleAnswer(freeText.trim());
                setFreeText('');
              }
            }}
            disabled={!freeText.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
