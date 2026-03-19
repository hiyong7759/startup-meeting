import { create } from 'zustand';
import type { PlayerProfile } from '@startup-meeting/types';
import { createNewProfile } from '@startup-meeting/engine';

interface PlayerState {
  profile: PlayerProfile | null;
  initProfile: (nickname: string) => void;
  updateProfile: (updater: (p: PlayerProfile) => PlayerProfile) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  profile: loadProfile(),
  initProfile: (nickname) => {
    const profile = createNewProfile(nickname);
    saveProfile(profile);
    set({ profile });
  },
  updateProfile: (updater) => set((s) => {
    if (!s.profile) return s;
    const updated = updater(s.profile);
    saveProfile(updated);
    return { profile: updated };
  }),
}));

function loadProfile(): PlayerProfile | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem('startup-meeting-profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

function saveProfile(profile: PlayerProfile): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('startup-meeting-profile', JSON.stringify(profile));
}
