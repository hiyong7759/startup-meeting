import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeetingSetup, SessionPhase } from '@startup-meeting/types';
import type { Role } from '@startup-meeting/types';
import type { DialogueEntry } from '@startup-meeting/composer';

// Saved meeting record (stored separately in localStorage)
export interface SavedMeeting {
  id: string;
  date: string;
  topic: string;
  rolePlayed: string;
  dialogue: DialogueEntry[];
  participantNames: string[];
}

interface GameState {
  sessionPhase: SessionPhase;
  topic: string;
  meetingSetup: MeetingSetup | null;
  userRole: Role | null;
  dialogue: DialogueEntry[];
  isLoading: boolean;
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
  saveMeeting: () => void;  // Save current meeting to history
  reset: () => void;
}

// localStorage helpers for meeting history
function loadMeetingHistory(): SavedMeeting[] {
  try {
    const raw = localStorage.getItem('startup-meeting-history');
    return raw ? JSON.parse(raw) as SavedMeeting[] : [];
  } catch { return []; }
}

function appendMeetingHistory(meeting: SavedMeeting): void {
  const history = loadMeetingHistory();
  history.push(meeting);
  // Keep last 50 meetings
  if (history.length > 50) history.shift();
  localStorage.setItem('startup-meeting-history', JSON.stringify(history));
}

export function getMeetingHistory(): SavedMeeting[] {
  return loadMeetingHistory();
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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

      // Save current meeting dialogue to persistent history
      saveMeeting: () => {
        const { topic, userRole, dialogue, meetingSetup } = get();
        if (!topic || dialogue.length === 0) return;

        appendMeetingHistory({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          topic,
          rolePlayed: userRole?.title ?? '',
          dialogue,
          participantNames: meetingSetup?.participants.map((p) => p.role.title) ?? [],
        });
      },

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
    }),
    {
      name: 'startup-meeting-game',
      partialize: (state) => ({
        sessionPhase: state.sessionPhase,
        topic: state.topic,
        meetingSetup: state.meetingSetup,
        userRole: state.userRole,
        dialogue: state.dialogue,
      }),
    },
  ),
);
