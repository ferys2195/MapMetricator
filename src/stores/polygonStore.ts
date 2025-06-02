import { create } from "zustand";

type Coordinate = [number, number];

interface PolygonState {
  polygonCoords: Coordinate[];
  setPolygonCoords: (coords: Coordinate[]) => void;
  addCoord: (coord: Coordinate) => void;
  removeCoord: (index: number) => void;
}

export const usePolygonStore = create<PolygonState>((set) => ({
  polygonCoords: [],
  setPolygonCoords: (coords) => set({ polygonCoords: coords }),
  addCoord: (coord) =>
    set((state) => ({ polygonCoords: [...state.polygonCoords, coord] })),
  removeCoord: (index) =>
    set((state) => {
      const newCoords = [...state.polygonCoords];
      newCoords.splice(index, 1);
      return { polygonCoords: newCoords };
    }),
}));
