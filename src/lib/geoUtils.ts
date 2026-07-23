import { round } from "@turf/turf";
import proj4 from "proj4";

type LatLng = { lat: number; lng: number };
type UtmResult = {
  easting: number;
  northing: number;
  zoneNumber: number;
  hemisphere: "north" | "south";
  getAsString: string;
};

export const getUtmZoneFromLongitude = (longitude: number): number => {
  return Math.floor((longitude + 180) / 6) + 1;
};

export const getUtmProjString = (
  zone: number,
  hemisphere: "north" | "south",
): string => {
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs ${hemisphere === "south" ? "+south" : ""}`;
};

export const getLatitudeBand = (lat: number): string => {
  if (lat < -80 || lat >= 84) return "";
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  const index = Math.floor((lat + 80) / 8);
  return bands.charAt(index);
};

export const latLngToUtm = ({ lat, lng }: LatLng): UtmResult => {
  const zoneNumber = getUtmZoneFromLongitude(lng);
  const hemisphere: "north" | "south" = lat >= 0 ? "north" : "south";
  const utmString = getUtmProjString(zoneNumber, hemisphere);

  const [easting, northing] = proj4("WGS84", utmString, [lng, lat]);

  const getAsString = `${zoneNumber}${hemisphere == "south" ? "S" : "N"} ${round(easting, 0)} ${round(northing)}`;

  return {
    easting,
    northing,
    zoneNumber,
    hemisphere,
    getAsString,
  };
};

export const latLngToUtmWithZone = (
  { lat, lng }: LatLng,
  zoneNumber: number,
  hemisphere: "north" | "south"
): { easting: number; northing: number } => {
  const utmString = getUtmProjString(zoneNumber, hemisphere);
  const [easting, northing] = proj4("WGS84", utmString, [lng, lat]);
  return { easting, northing };
};

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

export const utmToLatLngWithZone = (
  { easting, northing }: { easting: number; northing: number },
  zoneNumber: number,
  hemisphere: "north" | "south"
): LatLng => {
  const utmString = getUtmProjString(zoneNumber, hemisphere);
  const [lng, lat] = proj4(utmString, "WGS84", [easting, northing]);
  return { lat, lng };
};
