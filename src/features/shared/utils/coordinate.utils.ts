/**
 * Coordinate Utilities
 * Consolidated functions for coordinate operations, conversions, and calculations
 */

import { round } from "@turf/turf";
import proj4 from "proj4";

/** Coordinate types */
export type LatLng = { lat: number; lng: number };
export type LatLngTuple = [number, number];
export type LngLatTuple = [number, number];

export type UtmResult = {
  easting: number;
  northing: number;
  zoneNumber: number;
  hemisphere: "north" | "south";
  getAsString: string;
};

/**
 * Get UTM zone number from longitude
 * @param longitude - Longitude value
 * @returns UTM zone number (1-60)
 */
export const getUtmZoneFromLongitude = (longitude: number): number => {
  return Math.floor((longitude + 180) / 6) + 1;
};

/**
 * Get projection string for UTM conversion
 * @param zone - UTM zone number
 * @param hemisphere - "north" or "south"
 * @returns Proj4 projection string
 */
export const getUtmProjString = (
  zone: number,
  hemisphere: "north" | "south",
): string => {
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs ${
    hemisphere === "south" ? "+south" : ""
  }`;
};

/**
 * Convert LatLng to UTM coordinates
 * @param coords - LatLng object or tuple
 * @returns UTM result with easting, northing, zone, and formatted string
 */
export const latLngToUtm = (coords: LatLng | LatLngTuple): UtmResult => {
  const { lat, lng } = Array.isArray(coords)
    ? { lat: coords[0], lng: coords[1] }
    : coords;

  const zoneNumber = getUtmZoneFromLongitude(lng);
  const hemisphere: "north" | "south" = lat >= 0 ? "north" : "south";
  const utmString = getUtmProjString(zoneNumber, hemisphere);

  const [easting, northing] = proj4("WGS84", utmString, [lng, lat]);

  const getAsString = `${zoneNumber}${hemisphere === "south" ? "S" : "N"} ${round(easting, 0)} ${round(northing, 0)}`;

  return {
    easting,
    northing,
    zoneNumber,
    hemisphere,
    getAsString,
  };
};

/**
 * Convert UTM to LatLng coordinates
 * @param utm - UTM result object
 * @returns LatLng coordinates
 */
export const utmToLatLng = ({
  easting,
  northing,
  zoneNumber,
  hemisphere,
}: UtmResult): LatLng => {
  const utmString = getUtmProjString(zoneNumber, hemisphere);
  const [lng, lat] = proj4(utmString, "WGS84", [easting, northing]);

  return { lat, lng };
};

/**
 * Find closest point on a line segment
 * Used for snapping coordinates to existing geometry
 * @param point - Point to snap
 * @param segmentStart - Start point of segment
 * @param segmentEnd - End point of segment
 * @returns Closest point on the segment
 */
export const getClosestPointOnSegment = (
  point: LatLngTuple | [number, number],
  segmentStart: LatLngTuple | [number, number],
  segmentEnd: LatLngTuple | [number, number],
): LatLngTuple => {
  const p = point as [number, number];
  const a = segmentStart as [number, number];
  const b = segmentEnd as [number, number];

  const atob = [b[0] - a[0], b[1] - a[1]];
  const atop = [p[0] - a[0], p[1] - a[1]];

  const len = atob[0] * atob[0] + atob[1] * atob[1];
  const dot = atop[0] * atob[0] + atop[1] * atob[1];
  const t = Math.min(1, Math.max(0, dot / len));

  return [a[0] + atob[0] * t, a[1] + atob[1] * t];
};

/**
 * Calculate distance between two points in meters
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance in meters
 */
export const getDistance = (
  point1: LatLng | LatLngTuple,
  point2: LatLng | LatLngTuple,
): number => {
  const { lat: lat1, lng: lng1 } = Array.isArray(point1)
    ? { lat: point1[0], lng: point1[1] }
    : point1;
  const { lat: lat2, lng: lng2 } = Array.isArray(point2)
    ? { lat: point2[0], lng: point2[1] }
    : point2;

  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format coordinate as string
 * @param coords - Coordinates
 * @param precision - Decimal precision (default: 6)
 * @returns Formatted string
 */
export const formatCoordinate = (
  coords: LatLng | LatLngTuple,
  precision = 6,
): string => {
  const { lat, lng } = Array.isArray(coords)
    ? { lat: coords[0], lng: coords[1] }
    : coords;
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};
