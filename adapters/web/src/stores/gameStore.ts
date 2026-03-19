import { create } from 'zustand';
import type { MeetingSetup, SessionPhase } from '@startup-meeting/types';
import type { Role } from '@startup-meeting/types';
import type { DialogueEntry } from '@startup-meeting/composer';

interface GameState {
  sessionPhase: SessionPhase;
  topic: string;
  meetingSetup: MeetingSetup | null;
  userRole: Role | null;
  dialogue: DialogueEntry[];
  isLoading: boolean;
  // Streaming: partial text being generated for current speaker
  streamingText: string;
  streamingSpeaker: string | null;

  setTopic: (topic: string) => void;
  setSessionPhase: (phase: SessionPhase) => void;
  setMeetingSetup: (setup: MeetingSetup) => void;
  setUserRole: (role: Role) => void;
  addDialogue: (entry: DialogueEntry) => void;
  setLoading: (loading: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  startStreaming: (speaker: string) => void;
  endStreaming: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionPhase: 'idle',
  topic: '',
  meetingSetup: null,
  userRole: null,
  dialogue: [],
  isLoading: false,
  streamingText: '',
  streamingSpeaker: null,

  setTopic: (topic) => set({ topic, sessionPhase: 'topic_input' }),
  setSessionPhase: (sessionPhase) => set({ sessionPhase }),
  setMeetingSetup: (meetingSetup) => set({ meetingSetup }),
  setUserRole: (userRole) => set({ userRole, sessionPhase: 'meeting_active' }),
  addDialogue: (entry) => set((s) => ({ dialogue: [...s.dialogue, entry] })),
  setLoading: (isLoading) => set({ isLoading }),
  startStreaming: (speaker) => set({ streamingText: '', streamingSpeaker: speaker }),
  appendStreamChunk: (chunk) => set((s) => ({ streamingText: s.streamingText + chunk })),
  endStreaming: () => set({ streamingText: '', streamingSpeaker: null }),
  reset: () => set({
    sessionPhase: 'idle',
    topic: '',
    meetingSetup: null,
    userRole: null,
    dialogue: [],
    isLoading: false,
    streamingText: '',
    streamingSpeaker: null,
  }),
}));
