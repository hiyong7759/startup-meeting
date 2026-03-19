import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onSend: (message: string) => void;
  onSkip: () => void;
  onInterrupt: () => void;
  disabled: boolean;
  canInterrupt: boolean;
}

export default function UserInput({ onSend, onSkip, onInterrupt, disabled, canInterrupt }: Props) {
  const [text, setText] = useState('');
  const userRole = useGameStore((s) => s.userRole);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleEmoji = (emoji: string) => {
    onSend(emoji);
  };

  // When AI is talking, user can still type and send (interrupts automatically)
  const inputDisabled = disabled && !canInterrupt;

  return (
    <div className="border-t border-gray-700 p-3 space-y-2">
      <div className="flex gap-2">
        {canInterrupt && (
          <button
            onClick={onInterrupt}
            className="px-3 py-2 bg-orange-700 hover:bg-orange-600 rounded-lg text-sm font-semibold transition-colors animate-pulse"
          >
            끼어들기
          </button>
        )}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              handleSend();
            }
          }}
          disabled={inputDisabled}
          placeholder={
            canInterrupt
              ? '입력하면 말을 끊고 발언합니다...'
              : disabled
                ? 'AI가 발언 중...'
                : `${userRole?.title ?? ''}(으)로 발언하기`
          }
          className={`flex-1 px-4 py-2 bg-gray-800 border rounded-lg text-sm focus:outline-none text-white placeholder-gray-500 ${
            canInterrupt
              ? 'border-orange-600 focus:border-orange-500'
              : 'border-gray-700 focus:border-blue-500 disabled:opacity-50'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors"
        >
          보내기
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleEmoji('동의합니다')}
          disabled={inputDisabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          동의
        </button>
        <button
          onClick={() => handleEmoji('반대합니다')}
          disabled={inputDisabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          반대
        </button>
        <button
          onClick={() => handleEmoji('글쎄요, 좀 더 생각해봐야 할 것 같은데')}
          disabled={inputDisabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          글쎄요
        </button>
        <button
          onClick={() => handleEmoji('잠깐, 그게 무슨 말이에요?')}
          disabled={inputDisabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          헐
        </button>
        <div className="flex-1" />
        <button
          onClick={onSkip}
          disabled={inputDisabled}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          넘기기
        </button>
      </div>
    </div>
  );
}
