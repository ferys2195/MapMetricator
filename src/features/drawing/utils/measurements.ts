import L from "leaflet";
import { latLngToUtm } from "@/lib/geoUtils";

export const calculateUtmDistance = (p1: L.LatLng, p2: L.LatLng) => {
  const utm1 = latLngToUtm(p1);
  const utm2 = latLngToUtm(p2);
  return Math.sqrt(
    Math.pow(utm2.easting - utm1.easting, 2) + Math.pow(utm2.northing - utm1.northing, 2)
  );
};

export const calculateUtmArea = (latlngs: L.LatLng[]) => {
  if (latlngs.length < 3) return 0;
  let area = 0;
  const utms = latlngs.map(latLngToUtm);
  for (let i = 0; i < utms.length; i++) {
    const j = (i + 1) % utms.length;
    area += utms[i].easting * utms[j].northing;
    area -= utms[j].easting * utms[i].northing;
  }
  return Math.abs(area / 2);
};

export const getPoints = (latlngs: unknown): L.LatLng[] => {
  if (Array.isArray(latlngs) && latlngs.length > 0) {
    if (Array.isArray(latlngs[0])) {
      return getPoints(latlngs[0]);
    }
    return latlngs as L.LatLng[];
  }
  return [];
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};
