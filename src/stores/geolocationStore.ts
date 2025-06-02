// stores/useGeolocationStore.ts
import { create } from "zustand";

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  getCurrentPosition: () => void;
}

export const useGeolocationStore = create<GeolocationState>((set) => ({
  position: null,
  error: null,
  isLoading: false,

  getCurrentPosition: () => {
    if (!navigator.geolocation) {
      set({ error: "Geolocation not supported" });
      return;
    }

    set({ isLoading: true });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        set({
          error: err.message,
          isLoading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  },
}));
