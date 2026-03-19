import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onSend: (message: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export default function UserInput({ onSend, onSkip, disabled }: Props) {
  const [text, setText] = useState('');
  const userRole = useGameStore((s) => s.userRole);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleEmoji = (emoji: string) => {
    onSend(emoji);
  };

  return (
    <div className="border-t border-gray-700 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          placeholder={disabled ? 'AI가 발언 중...' : `${userRole?.title ?? ''}(으)로 발언하기`}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 text-white placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors"
        >
          보내기
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleEmoji('agree')}
          disabled={disabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
          title="동의"
        >
          동의
        </button>
        <button
          onClick={() => handleEmoji('disagree')}
          disabled={disabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          반대
        </button>
        <button
          onClick={() => handleEmoji('thinking')}
          disabled={disabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          글쎄요
        </button>
        <button
          onClick={() => handleEmoji('surprised')}
          disabled={disabled}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          헐
        </button>
        <div className="flex-1" />
        <button
          onClick={onSkip}
          disabled={disabled}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          넘기기
        </button>
      </div>
    </div>
  );
}
