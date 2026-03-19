import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetingHistory, deleteMeetingHistory } from '../stores/gameStore';
import type { SavedMeeting } from '../stores/gameStore';

export default function History() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<SavedMeeting[]>(getMeetingHistory);
  const [selected, setSelected] = useState<SavedMeeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = useCallback((id: string) => {
    deleteMeetingHistory(id);
    setMeetings(getMeetingHistory());
    if (selected?.id === id) setSelected(null);
    setDeleteTarget(null);
  }, [selected]);

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4">
        <p className="text-gray-400">아직 회의 기록이 없습니다.</p>
        <button
          onClick={() => navigate('/lobby')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          첫 회의 시작하기
        </button>
      </div>
    );
  }

  // Detail view
  if (selected) {
    const minutesText = formatMinutes(selected);

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← 목록으로
        </button>

        <div>
          <h2 className="text-xl font-bold">{selected.topic}</h2>
          <p className="text-sm text-gray-400">
            {new Date(selected.date).toLocaleString()} | {selected.rolePlayed} 역할
          </p>
          <p className="text-xs text-gray-500 mt-1">
            참석자: {selected.participantNames.join(', ')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(minutesText);
            }}
            className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors"
          >
            회의록 복사
          </button>
          <button
            onClick={() => {
              const blob = new Blob([minutesText], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `meeting-${selected.date.slice(0, 10)}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors"
          >
            회의록 다운로드
          </button>
        </div>

        {/* Dialogue */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400">대화 기록</h3>
          {selected.dialogue.map((entry, i) => {
            const isUser = entry.role === selected.rolePlayed;
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : ''}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                  <span className="text-xs text-gray-400 block mb-1">{entry.speaker}</span>
                  {entry.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-6">지난 회의</h2>
      <div className="space-y-3">
        {[...meetings].reverse().map((meeting) => (
          <div key={meeting.id} className="relative group">
            <button
              onClick={() => setSelected(meeting)}
              className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center gap-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{meeting.topic}</div>
                <div className="text-xs text-gray-400">
                  {meeting.rolePlayed} | {new Date(meeting.date).toLocaleDateString()} | {meeting.dialogue.length}턴
                </div>
              </div>
              <div className="text-gray-500">→</div>
            </button>

            {/* Delete button */}
            {deleteTarget === meeting.id ? (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <button
                  onClick={() => handleDelete(meeting.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs text-white transition-colors"
                >
                  확인
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(meeting.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}

// Format meeting dialogue into a markdown meeting minutes doc
function formatMinutes(meeting: SavedMeeting): string {
  const lines: string[] = [
    `# 회의록: ${meeting.topic}`,
    '',
    `- 일시: ${new Date(meeting.date).toLocaleString()}`,
    `- 내 역할: ${meeting.rolePlayed}`,
    `- 참석자: ${meeting.participantNames.join(', ')}`,
    '',
    '## 대화 내용',
    '',
  ];

  for (const entry of meeting.dialogue) {
    lines.push(`**${entry.speaker}**: ${entry.text}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('이 회의록을 Claude Code에 전달하면 결정사항 기반으로 PRD/코드/테스트를 자동 생성할 수 있습니다.');

  return lines.join('\n');
}
