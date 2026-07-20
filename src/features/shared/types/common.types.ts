import type L from "leaflet";

/**
 * Common coordinate types used throughout the application
 */

/** Latitude-Longitude pair as [lat, lng] */
export type LatLngTuple = [number, number];

/** Longitude-Latitude pair as [lng, lat] (GeoJSON standard) */
export type LngLatTuple = [number, number];

/** Coordinate with metadata */
export interface CoordinateWithMetadata extends L.LatLng {
  id?: string | number;
  label?: string;
  timestamp?: number;
}

/** Map mode types */
export type MapMode = "idle" | "marker" | "line" | "polygon";

/** Measurement unit types */
export type MeasurementUnit = "meters" | "kilometers" | "feet" | "miles";

/** Common geometry types */
export interface Point {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** API response types */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
