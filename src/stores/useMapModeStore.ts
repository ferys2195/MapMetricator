import { create } from "zustand";

export type MapMode = "idle" | "marker" | "polyline";

type State = {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
};

export const useMapModeStore = create<State>((set) => ({
  mode: "idle",
  setMode: (mode) => set({ mode }),
}));
