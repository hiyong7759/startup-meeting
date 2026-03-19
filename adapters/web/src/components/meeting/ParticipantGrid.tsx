import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import type { MeetingParticipant } from '@startup-meeting/types';
import ParticipantCard from './ParticipantCard';
import ParticipantModal from './ParticipantModal';

interface Props {
  typingId: string | null;
}

export default function ParticipantGrid({ typingId }: Props) {
  const meetingSetup = useGameStore((s) => s.meetingSetup);
  const userRole = useGameStore((s) => s.userRole);
  const activeSpeakerId = useUiStore((s) => s.activeSpeakerId);
  const [selectedParticipant, setSelectedParticipant] = useState<{ participant: MeetingParticipant; isUser: boolean } | null>(null);

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
            onSelect={(p) => setSelectedParticipant({ participant: p, isUser: false })}
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
            onSelect={(p) => setSelectedParticipant({ participant: p, isUser: true })}
          />
        </div>
      )}

      <ParticipantModal
        participant={selectedParticipant?.participant ?? null}
        isUser={selectedParticipant?.isUser ?? false}
        onClose={() => setSelectedParticipant(null)}
      />
    </div>
  );
}
