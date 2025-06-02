// stores/useMapInstanceStore.ts
import { create } from "zustand";

interface MapInstanceState {
  map: L.Map | null;
  setMap: (map: L.Map) => void;
}

export const useMapInstanceStore = create<MapInstanceState>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
}));
