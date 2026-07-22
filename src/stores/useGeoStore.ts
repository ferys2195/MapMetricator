import { create } from "zustand";
import type { Waypoint, Track, Route } from "@/lib/gpxParser";

interface GeoStore {
  waypoints: Waypoint[];
  tracks: Track[];
  routes: Route[];
  
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (index: number) => void;
  
  setTracks: (tracks: Track[]) => void;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  
  setRoutes: (routes: Route[]) => void;
  addRoute: (route: Route) => void;
  removeRoute: (id: string) => void;

  isWaypointDialogOpen: boolean;
  waypointDialogUtm: string;
  openWaypointDialog: (utm?: string) => void;
  closeWaypointDialog: () => void;
}

export const useGeoStore = create<GeoStore>((set) => ({
  waypoints: [],
  tracks: [],
  routes: [],
  
  setWaypoints: (waypoints) => set({ waypoints }),
  addWaypoint: (waypoint) => set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  removeWaypoint: (index) => set((state) => ({
    waypoints: state.waypoints.filter((_, i) => i !== index)
  })),
  
  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id)
  })),
  
  setRoutes: (routes) => set({ routes }),
  addRoute: (route) => set((state) => ({ routes: [...state.routes, route] })),
  removeRoute: (id) => set((state) => ({
    routes: state.routes.filter(r => r.id !== id)
  })),

  isWaypointDialogOpen: false,
  waypointDialogUtm: "",
  openWaypointDialog: (utm = "") => set({ isWaypointDialogOpen: true, waypointDialogUtm: utm }),
  closeWaypointDialog: () => set({ isWaypointDialogOpen: false, waypointDialogUtm: "" }),
}));
