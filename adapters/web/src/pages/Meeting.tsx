import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { streamCharacterUtterance, streamReactionToUser } from '@startup-meeting/composer';
import type { MeetingContext, DialogueEntry } from '@startup-meeting/composer';
import ChatStream from '../components/meeting/ChatStream';
import ParticipantGrid from '../components/meeting/ParticipantGrid';
import UserInput from '../components/meeting/UserInput';
import EventBanner from '../components/meeting/EventBanner';
import MetricsPanel from '../components/meeting/MetricsPanel';

type MeetingMood = 'calm' | 'tense' | 'heated' | 'chaotic';

export default function Meeting() {
  const navigate = useNavigate();
  const {
    meetingSetup, userRole, dialogue, addDialogue,
    setSessionPhase, isLoading, setLoading,
    startStreaming, appendStreamChunk, endStreaming,
  } = useGameStore();
  const { activeSpeakerId, setActiveSpeaker, isMetricsPanelOpen, toggleMetricsPanel } = useUiStore();
  const [currentEvent, setCurrentEvent] = useState<{ title: string; description: string } | null>(null);
  const [isAiTurn, setIsAiTurn] = useState(true);
  const [turnIndex, setTurnIndex] = useState(0);

  useEffect(() => {
    if (!meetingSetup || !userRole) {
      navigate('/lobby');
    }
  }, [meetingSetup, userRole, navigate]);

  const getMeetingContext = useCallback((): MeetingContext => ({
    agenda: meetingSetup!.agenda,
    participants: meetingSetup!.participants,
    dialogueHistory: dialogue,
    currentEvent: currentEvent?.description,
    userRole: userRole!,
  }), [meetingSetup, dialogue, currentEvent, userRole]);

  // AI turn with streaming
  const runAiTurn = useCallback(async () => {
    if (!meetingSetup || !userRole) return;

    const aiParticipants = meetingSetup.participants.filter(
      (p) => p.role.id !== userRole.id,
    );

    if (turnIndex >= aiParticipants.length) {
      setIsAiTurn(false);
      setActiveSpeaker(userRole.id);
      return;
    }

    const participant = aiParticipants[turnIndex];
    setLoading(true);

    // Start streaming — highlight card + show partial text in chat
    setActiveSpeaker(participant.role.id);
    startStreaming(participant.role.title);

    try {
      const context = getMeetingContext();
      const utterance = await streamCharacterUtterance(
        participant,
        context,
        (chunk) => appendStreamChunk(chunk),
      );

      // Streaming done — add final message to dialogue
      endStreaming();
      addDialogue({
        speaker: participant.role.title,
        role: participant.role.title,
        text: utterance.text,
      });
      setTurnIndex((prev) => prev + 1);
    } catch (error) {
      console.error('AI turn failed:', error);
      endStreaming();
      addDialogue({
        speaker: participant.role.title,
        role: participant.role.title,
        text: '...',
      });
      setTurnIndex((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [meetingSetup, userRole, turnIndex, getMeetingContext, addDialogue, setActiveSpeaker, setLoading, startStreaming, appendStreamChunk, endStreaming]);

  useEffect(() => {
    if (isAiTurn && meetingSetup && userRole && !isLoading) {
      const timer = setTimeout(runAiTurn, 500);
      return () => clearTimeout(timer);
    }
  }, [isAiTurn, turnIndex, isLoading, runAiTurn, meetingSetup, userRole]);

  // User send with streaming reactions
  const handleUserSend = useCallback(async (message: string) => {
    if (!meetingSetup || !userRole) return;

    addDialogue({
      speaker: userRole.title,
      role: userRole.title,
      text: message,
    });
    setIsAiTurn(true);
    setLoading(true);

    const aiParticipants = meetingSetup.participants.filter(
      (p) => p.role.id !== userRole.id,
    );
    const reactors = aiParticipants.slice(0, Math.min(3, aiParticipants.length));

    for (const reactor of reactors) {
      setActiveSpeaker(reactor.role.id);
      startStreaming(reactor.role.title);

      try {
        const context = getMeetingContext();
        const reaction = await streamReactionToUser(
          reactor,
          message,
          context,
          (chunk) => appendStreamChunk(chunk),
        );

        endStreaming();
        addDialogue({
          speaker: reactor.role.title,
          role: reactor.role.title,
          text: reaction.text,
        });
      } catch {
        endStreaming();
        addDialogue({
          speaker: reactor.role.title,
          role: reactor.role.title,
          text: '...',
        });
      }
    }

    setLoading(false);
    setIsAiTurn(false);
    setActiveSpeaker(userRole.id);
  }, [meetingSetup, userRole, addDialogue, getMeetingContext, setActiveSpeaker, setLoading, startStreaming, appendStreamChunk, endStreaming]);

  const handleSkip = useCallback(() => {
    setIsAiTurn(true);
    setTurnIndex(0);
  }, []);

  const handleEndMeeting = useCallback(() => {
    setSessionPhase('evaluation');
    navigate('/result');
  }, [setSessionPhase, navigate]);

  const mood: MeetingMood = dialogue.length > 15 ? 'heated' : dialogue.length > 8 ? 'tense' : 'calm';

  if (!meetingSetup || !userRole) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div className="text-sm font-semibold truncate flex-1">
          {meetingSetup.agenda.title}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Turn {dialogue.length}</span>
          <button
            onClick={handleEndMeeting}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-white text-xs transition-colors"
          >
            End Meeting
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <EventBanner event={currentEvent} onDismiss={() => setCurrentEvent(null)} />

        <div className="flex-1 flex flex-col border-r border-gray-800">
          <ChatStream />
          <UserInput
            onSend={handleUserSend}
            onSkip={handleSkip}
            disabled={isAiTurn || isLoading}
          />
        </div>

        <div className="w-80 flex flex-col bg-gray-900 overflow-y-auto">
          <ParticipantGrid typingId={null} />
          <div className="p-4 border-t border-gray-800">
            <MetricsPanel
              isOpen={isMetricsPanelOpen}
              onToggle={toggleMetricsPanel}
              mood={mood}
              turnCount={dialogue.length}
              participantCount={meetingSetup.participants.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
