import L from "leaflet";
import { calculateUtmDistance, formatDistance } from "./measurements";

export const createMeasurementMarker = (map: L.Map, pA: L.LatLng, pB: L.LatLng) => {
  const dist = calculateUtmDistance(pA, pB);
  if (dist < 0.2) return null;

  const formatted = formatDistance(dist);
  const midLat = (pA.lat + pB.lat) / 2;
  const midLng = (pA.lng + pB.lng) / 2;
  const pos = L.latLng(midLat, midLng);

  const ptA = map.project(pA);
  const ptB = map.project(pB);
  let angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
  if (angle > 90 || angle < -90) angle += 180;

  const labelIcon = L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center; pointer-events: none; transform: translate(-50%, -50%) rotate(${angle}deg);">
        <div style="font-size: 13px; font-weight: 800; white-space: nowrap; z-index: 1100; line-height: 1; color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
          ${formatted}
        </div>
      </div>
    `,
    className: 'measurement-distance-tag',
    iconSize: [0, 0]
  });

  return L.marker(pos, { icon: labelIcon, interactive: false });
};
