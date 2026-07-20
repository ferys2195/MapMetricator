import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";
import L from "leaflet";
import { useGeoStore } from "@/stores/useGeoStore";
import { latLngToUtm } from "@/lib/geoUtils";

const calculateUtmDistance = (p1: L.LatLng, p2: L.LatLng) => {
  const utm1 = latLngToUtm(p1);
  const utm2 = latLngToUtm(p2);
  return Math.sqrt(
    Math.pow(utm2.easting - utm1.easting, 2) + Math.pow(utm2.northing - utm1.northing, 2)
  );
};

const calculateUtmArea = (latlngs: L.LatLng[]) => {
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

const getPoints = (latlngs: unknown): L.LatLng[] => {
  if (Array.isArray(latlngs) && latlngs.length > 0) {
    if (Array.isArray(latlngs[0])) {
      return getPoints(latlngs[0]);
    }
    return latlngs as L.LatLng[];
  }
  return [];
};

export default function GeomanSetup() {
  const map = useMap();
  const { addWaypoint } = useGeoStore();

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawCircleMarker: false,
      drawCircle: false,
      drawText: false,
      editControls: true,
      drawMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
    });

    const updateTooltip = (layer: L.Layer) => {
      const polyLayer = layer as L.Polyline | L.Polygon;
      if (!polyLayer.getLatLngs) return;
      
      const latlngs = getPoints(polyLayer.getLatLngs());
      if (layer instanceof L.Polygon) {
        const area = calculateUtmArea(latlngs);
        layer.unbindTooltip();
        layer.bindTooltip(`<b>Area: ${area.toFixed(2)} m²</b>`, { permanent: true, direction: "center" }).openTooltip();
      } else if (layer instanceof L.Polyline) {
        let total = 0;
        let segmentsText = "";
        for (let i = 0; i < latlngs.length - 1; i++) {
          const dist = calculateUtmDistance(latlngs[i], latlngs[i + 1]);
          total += dist;
          if (latlngs.length <= 10) {
             segmentsText += `Seg ${i + 1}: ${dist.toFixed(2)}m<br>`;
          }
        }
        layer.unbindTooltip();
        layer.bindTooltip(`${segmentsText}<b>Total: ${total.toFixed(2)}m</b>`, { permanent: true, direction: "center" }).openTooltip();
      }
    };

    map.on("pm:create", (e) => {
      const { shape, layer } = e;

      if (shape === "Marker") {
        const latlng = (layer as L.Marker).getLatLng();
        const utm = latLngToUtm(latlng);
        const name = prompt(`Enter waypoint name:\nUTM: ${utm.getAsString}`, "New Waypoint");
        if (name) {
          addWaypoint({ lat: latlng.lat, lon: latlng.lng, name });
          layer.bindTooltip(name, { permanent: true, direction: "top" }).openTooltip();
        } else {
          map.removeLayer(layer);
        }
      } else {
        updateTooltip(layer);
        
        // Listen for edits
        layer.on("pm:edit", () => updateTooltip(layer));
        layer.on("pm:vertexadded", () => updateTooltip(layer));
        layer.on("pm:vertexremoved", () => updateTooltip(layer));
        layer.on("pm:markerdragend", () => updateTooltip(layer));
        layer.on("pm:dragend", () => updateTooltip(layer));
      }
    });

    return () => {
      map.pm.removeControls();
      map.off("pm:create");
    };
  }, [map, addWaypoint]);

  return null;
}
