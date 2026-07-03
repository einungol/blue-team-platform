import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Lab, Team } from '@/types';

interface LabStore {
  labs: Lab[];
  loading: boolean;
  error: string | null;
  fetchLabs: () => Promise<void>;
  submitFlag: (labId: number, flag: string) => Promise<{ message: string; points: number }>;
}

export const useLabStore = create<LabStore>((set, get) => ({
  labs: [],
  loading: false,
  error: null,

  fetchLabs: async () => {
    set({ loading: true, error: null });
    try {
      const labs = await api.getLabs();
      set({ labs, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  submitFlag: async (labId: number, flag: string) => {
    const result = await api.submitFlag(labId, flag);
    return result;
  },
}));

interface TeamStore {
  teams: Team[];
  loading: boolean;
  fetchTeams: () => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  loading: false,

  fetchTeams: async () => {
    set({ loading: true });
    try {
      const teams = await api.getTeams();
      set({ teams, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));