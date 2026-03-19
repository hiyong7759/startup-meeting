import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import ParticipantCard from './ParticipantCard';

interface Props {
  typingId: string | null;
}

export default function ParticipantGrid({ typingId }: Props) {
  const meetingSetup = useGameStore((s) => s.meetingSetup);
  const userRole = useGameStore((s) => s.userRole);
  const activeSpeakerId = useUiStore((s) => s.activeSpeakerId);

  if (!meetingSetup) return null;

  const aiParticipants = meetingSetup.participants.filter(
    (p) => p.role.id !== userRole?.id,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {aiParticipants.map((participant) => (
          <ParticipantCard
            key={participant.role.id}
            participant={participant}
            isSpeaking={activeSpeakerId === participant.role.id}
            isTyping={typingId === participant.role.id}
            isUser={false}
          />
        ))}
      </div>

      {userRole && (
        <div className="mt-auto">
          <ParticipantCard
            participant={{
              role: userRole,
              relevance: '',
              initialStance: '',
            }}
            isSpeaking={activeSpeakerId === userRole.id}
            isTyping={false}
            isUser={true}
          />
        </div>
      )}
    </div>
  );
}
