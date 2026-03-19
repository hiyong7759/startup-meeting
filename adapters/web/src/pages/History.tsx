import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-gray-400',
  D: 'text-red-400',
};

export default function History() {
  const navigate = useNavigate();
  const profile = usePlayerStore((s) => s.profile);

  if (!profile || profile.meetingHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4">
        <p className="text-gray-400">No meeting history yet.</p>
        <button
          onClick={() => navigate('/lobby')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Start First Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-6">Meeting History</h2>
      <div className="space-y-3">
        {[...profile.meetingHistory].reverse().map((meeting) => (
          <div key={meeting.id} className="p-4 bg-gray-800 rounded-xl flex items-center gap-4">
            <div className={`text-2xl font-black w-10 text-center ${GRADE_COLORS[meeting.grade] ?? 'text-gray-400'}`}>
              {meeting.grade}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{meeting.topic}</div>
              <div className="text-xs text-gray-400">
                {meeting.rolePlayedTitle} | {new Date(meeting.date).toLocaleDateString()} | +{meeting.xpEarned} XP
              </div>
            </div>
            <div className="text-sm text-gray-500">{meeting.score}/25</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
