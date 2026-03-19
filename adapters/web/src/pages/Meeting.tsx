import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { streamCharacterUtterance, streamReactionToUser } from '@startup-meeting/composer';
import type { MeetingContext, DialogueEntry } from '@startup-meeting/composer';
import type { MeetingParticipant } from '@startup-meeting/types';
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
    startStreaming, appendStreamChunk, endStreaming, saveMeeting,
    streamingText, streamingSpeaker,
  } = useGameStore();
  const { activeSpeakerId, setActiveSpeaker, isMetricsPanelOpen, toggleMetricsPanel } = useUiStore();
  const [currentEvent, setCurrentEvent] = useState<{ title: string; description: string } | null>(null);
  // If dialogue already exists (restored from persist), don't auto-start AI
  const hasRestoredSession = dialogue.length > 0;
  const [isAiTurn, setIsAiTurn] = useState(!hasRestoredSession);
  const [turnIndex, setTurnIndex] = useState(0);
  const [roundSpeakers, setRoundSpeakers] = useState<MeetingParticipant[]>([]);

  // AbortController for cancelling current AI stream
  const abortRef = useRef<AbortController | null>(null);

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

  // Pick speakers once at the start of each AI round
  const pickNewSpeakers = useCallback(() => {
    if (!meetingSetup || !userRole) return;
    const aiParticipants = meetingSetup.participants.filter(
      (p) => p.role.id !== userRole.id,
    );
    const count = Math.min(2 + Math.floor(Math.random() * 2), aiParticipants.length);
    const shuffled = [...aiParticipants].sort(() => Math.random() - 0.5);
    setRoundSpeakers(shuffled.slice(0, count));
    setTurnIndex(0);
  }, [meetingSetup, userRole]);

  // Pick speakers on first render and when a new AI round starts
  useEffect(() => {
    if (isAiTurn && roundSpeakers.length === 0 && meetingSetup && userRole) {
      pickNewSpeakers();
    }
  }, [isAiTurn, roundSpeakers.length, meetingSetup, userRole, pickNewSpeakers]);

  const runAiTurn = useCallback(async () => {
    if (!meetingSetup || !userRole || roundSpeakers.length === 0) return;

    if (turnIndex >= roundSpeakers.length) {
      setIsAiTurn(false);
      setRoundSpeakers([]);
      setActiveSpeaker(userRole.id);
      return;
    }

    const participant = roundSpeakers[turnIndex];
    setLoading(true);
    setActiveSpeaker(participant.role.id);
    startStreaming(participant.role.title);

    // Create abort controller for this turn
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const context = getMeetingContext();
      const utterance = await streamCharacterUtterance(
        participant,
        context,
        (chunk) => appendStreamChunk(chunk),
        controller.signal,
      );

      endStreaming();
      addDialogue({
        speaker: participant.role.title,
        role: participant.role.title,
        text: utterance.text,
      });
      setTurnIndex((prev) => prev + 1);
    } catch (error) {
      // If aborted by user interrupt, save partial text
      if (error instanceof DOMException && error.name === 'AbortError') {
        const partialText = useGameStore.getState().streamingText;
        endStreaming();
        if (partialText) {
          addDialogue({
            speaker: participant.role.title,
            role: participant.role.title,
            text: partialText + '...',
          });
        }
        // Don't advance turnIndex — user interrupted
        return;
      }

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
      abortRef.current = null;
    }
  }, [meetingSetup, userRole, turnIndex, roundSpeakers, getMeetingContext, addDialogue, setActiveSpeaker, setLoading, startStreaming, appendStreamChunk, endStreaming]);

  useEffect(() => {
    if (isAiTurn && meetingSetup && userRole && !isLoading) {
      const timer = setTimeout(runAiTurn, 500);
      return () => clearTimeout(timer);
    }
  }, [isAiTurn, turnIndex, isLoading, runAiTurn, meetingSetup, userRole]);

  // Interrupt: cancel current AI stream and let user speak
  const handleInterrupt = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsAiTurn(false);
    setLoading(false);
    setActiveSpeaker(userRole?.id ?? null);
  }, [setLoading, setActiveSpeaker, userRole]);

  const handleUserSend = useCallback(async (message: string) => {
    if (!meetingSetup || !userRole) return;

    // If AI is talking, interrupt first
    if (isAiTurn && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;

      // Save partial text if any
      const partialText = useGameStore.getState().streamingText;
      const speaker = useGameStore.getState().streamingSpeaker;
      endStreaming();
      if (partialText && speaker) {
        addDialogue({ speaker, role: speaker, text: partialText + '...' });
      }
    }

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
      const controller = new AbortController();
      abortRef.current = controller;

      setActiveSpeaker(reactor.role.id);
      startStreaming(reactor.role.title);

      try {
        const context = getMeetingContext();
        const reaction = await streamReactionToUser(
          reactor,
          message,
          context,
          (chunk) => appendStreamChunk(chunk),
          controller.signal,
        );

        endStreaming();
        addDialogue({
          speaker: reactor.role.title,
          role: reactor.role.title,
          text: reaction.text,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          const partialText = useGameStore.getState().streamingText;
          endStreaming();
          if (partialText) {
            addDialogue({ speaker: reactor.role.title, role: reactor.role.title, text: partialText + '...' });
          }
          break; // Stop further reactions
        }
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
    setRoundSpeakers([]);
    setActiveSpeaker(userRole.id);
    abortRef.current = null;
  }, [meetingSetup, userRole, isAiTurn, addDialogue, getMeetingContext, setActiveSpeaker, setLoading, startStreaming, appendStreamChunk, endStreaming]);

  const handleSkip = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    endStreaming();
    setRoundSpeakers([]);
    setIsAiTurn(true);
  }, [endStreaming]);

  const handleEndMeeting = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    saveMeeting(); // Save dialogue to history before leaving
    setSessionPhase('evaluation');
    navigate('/result');
  }, [saveMeeting, setSessionPhase, navigate]);

  const mood: MeetingMood = dialogue.length > 15 ? 'heated' : dialogue.length > 8 ? 'tense' : 'calm';

  if (!meetingSetup || !userRole) return null;

  // User can interrupt when AI is streaming
  const canInterrupt = isAiTurn && isLoading && !!streamingSpeaker;

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
            회의 종료
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
            onInterrupt={handleInterrupt}
            disabled={isAiTurn && !canInterrupt}
            canInterrupt={canInterrupt}
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
