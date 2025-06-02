// stores/useMarkerStore.ts
import { create } from "zustand";
import L from "leaflet";

interface MarkerStore {
  markers: L.LatLng[];
  isAddingMarker: boolean;
  addMarker: (latlng: L.LatLng) => void;
  removeMarker: (latlng: L.LatLng) => void; // ✅ pakai position
  toggleAddingMarker: () => void;
  setAddingMarker: (value: boolean) => void;
}

export const useMarkerStore = create<MarkerStore>((set) => ({
  markers: [],
  isAddingMarker: false,
  addMarker: (latlng) =>
    set((state) => ({ markers: [...state.markers, latlng] })),
  removeMarker: (latlngToRemove) =>
    set((state) => ({
      markers: state.markers.filter(
        (marker) => !marker.equals(latlngToRemove), // ✅ pakai L.LatLng.equals
      ),
    })),
  toggleAddingMarker: () =>
    set((state) => ({ isAddingMarker: !state.isAddingMarker })),
  setAddingMarker: (value) => set({ isAddingMarker: value }),
}));
