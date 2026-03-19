import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function Lobby() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const setMeetingTopic = useGameStore((s) => s.setTopic);

  const handleSubmit = () => {
    if (!topic.trim()) return;
    setMeetingTopic(topic.trim());
    navigate('/setup');
  };

  const handleGacha = (rarity?: string) => {
    setMeetingTopic(rarity ? `__gacha_${rarity}__` : '__gacha__');
    navigate('/setup');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-8 p-8">
      <h2 className="text-2xl font-bold">오늘의 회의</h2>

      <div className="w-full max-w-md">
        <label className="block text-sm text-gray-400 mb-2">주제 직접 입력:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="예: 마케팅 예산을 50% 줄여야 할 것 같아"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
          />
          <button
            onClick={handleSubmit}
            disabled={!topic.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-semibold transition-colors"
          >
            생성
          </button>
        </div>
      </div>

      <div className="text-gray-500 text-sm">── 또는 뽑기 ──</div>

      <div className="flex gap-3">
        <button onClick={() => handleGacha('common')} className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-lg transition-colors">
          일상
        </button>
        <button onClick={() => handleGacha('uncommon')} className="px-6 py-3 bg-yellow-800 hover:bg-yellow-700 rounded-lg transition-colors">
          전략
        </button>
        <button onClick={() => handleGacha('rare')} className="px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg transition-colors">
          위기
        </button>
      </div>

      <button onClick={() => handleGacha()} className="px-8 py-4 bg-purple-700 hover:bg-purple-600 rounded-xl text-lg font-semibold transition-colors">
        가챠! (티켓 1장)
      </button>
    </div>
  );
}
