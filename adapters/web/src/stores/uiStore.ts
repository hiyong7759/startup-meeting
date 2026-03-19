import { create } from 'zustand';

interface UiState {
  isMeetingPanelOpen: boolean;
  isMetricsPanelOpen: boolean;
  activeSpeakerId: string | null;

  toggleMeetingPanel: () => void;
  toggleMetricsPanel: () => void;
  setActiveSpeaker: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMeetingPanelOpen: true,
  isMetricsPanelOpen: false,
  activeSpeakerId: null,

  toggleMeetingPanel: () => set((s) => ({ isMeetingPanelOpen: !s.isMeetingPanelOpen })),
  toggleMetricsPanel: () => set((s) => ({ isMetricsPanelOpen: !s.isMetricsPanelOpen })),
  setActiveSpeaker: (activeSpeakerId) => set({ activeSpeakerId }),
}));
