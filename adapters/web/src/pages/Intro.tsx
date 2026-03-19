import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';

export default function Intro() {
  const navigate = useNavigate();
  const profile = usePlayerStore((s) => s.profile);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">스타트업 회의실</h2>
        <p className="text-gray-400 text-lg">"오늘도 회의가 있습니다"</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/lobby')}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-colors"
        >
          새 회의 시작
        </button>
        <button
          onClick={() => navigate('/history')}
          className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-semibold transition-colors"
        >
          지난 회의 목록
        </button>
      </div>

      {profile && (
        <div className="text-center text-gray-400">
          <p className="text-sm">Lv.{profile.level} {profile.title}</p>
          <p className="text-sm">{profile.xp} XP · 가챠 티켓 x{profile.gachaTickets}</p>
        </div>
      )}
    </div>
  );
}
