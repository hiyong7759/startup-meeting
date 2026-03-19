import type { MeetingParticipant } from '@startup-meeting/types';

interface Props {
  participants: MeetingParticipant[];
  onSelect: (participant: MeetingParticipant) => void;
}

const LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  executive: { label: 'C-Level', color: 'bg-yellow-900 text-yellow-300' },
  manager: { label: 'Manager', color: 'bg-blue-900 text-blue-300' },
  senior: { label: 'Senior', color: 'bg-green-900 text-green-300' },
  junior: { label: 'Junior', color: 'bg-gray-700 text-gray-300' },
  intern: { label: 'Intern', color: 'bg-purple-900 text-purple-300' },
};

export default function RoleSelector({ participants, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {participants.map((participant) => {
        const { role } = participant;
        const badge = LEVEL_BADGES[role.level] ?? LEVEL_BADGES.junior;

        return (
          <button
            key={role.id}
            onClick={() => onSelect(participant)}
            className="text-left p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-xl transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gray-600 group-hover:bg-gray-500 rounded-full flex items-center justify-center text-xl font-bold transition-colors">
                {role.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{role.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{participant.relevance}</p>
                <p className="text-xs text-gray-500 mt-1 italic">"{participant.initialStance}"</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
