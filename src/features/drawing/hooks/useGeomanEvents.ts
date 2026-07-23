import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGeoStore } from "@/stores/useGeoStore";
import { latLngToUtm, getLatitudeBand } from "@/lib/geoUtils";
import { toast } from "sonner";

const extractCoords = (layer: any): [number, number][] => {
  const result: [number, number][] = [];

  const flattenLatLngs = (arr: any) => {
    if (!arr) return;
    if (typeof arr.lat === "number" && (typeof arr.lng === "number" || typeof arr.lon === "number")) {
      const lat = arr.lat;
      const lng = typeof arr.lng === "number" ? arr.lng : arr.lon;
      if (!isNaN(lat) && !isNaN(lng)) {
        result.push([lat, lng]);
      }
      return;
    }
    if (Array.isArray(arr)) {
      arr.forEach((item) => flattenLatLngs(item));
    }
  };

  if (typeof layer.getLatLngs === "function") {
    flattenLatLngs(layer.getLatLngs());
  } else if (typeof layer.getLatLng === "function") {
    flattenLatLngs(layer.getLatLng());
  }

  return result;
};

export const useGeomanEvents = () => {
  const map = useMap();
  const { openWaypointDialog, addRoute } = useGeoStore();

  useEffect(() => {
    const handleCreate = (e: any) => {
      const { shape, layer } = e;

      if (shape === "Marker") {
        const latlng = (layer as L.Marker).getLatLng();
        const utm = latLngToUtm(latlng);
        const band = getLatitudeBand(latlng.lat);
        const garminUtm = `${utm.zoneNumber}${band} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
        
        setTimeout(() => {
          try {
            map.removeLayer(layer);
          } catch (err) {
            console.error("Failed to remove marker layer:", err);
          }
        }, 10);
        
        openWaypointDialog(garminUtm);
      } else {
        const points = extractCoords(layer);
        
        if (points.length >= 2) {
          if ((shape === "Polygon" || shape === "Rectangle") && points.length > 2) {
            const first = points[0];
            const last = points[points.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              points.push([first[0], first[1]]);
            }
          }

          const currentRoutes = useGeoStore.getState().routes;
          const routeName = `${shape} ${currentRoutes.length + 1}`;
          const routeId = `rte-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          addRoute({
            id: routeId,
            name: routeName,
            points,
          });

          toast.success(`${routeName} berhasil ditambahkan ke Route!`);
        } else {
          toast.error("Gagal mengekstrak koordinat dari hasil gambar.");
        }

        setTimeout(() => {
          try {
            if ((layer as any)._measurementMarkers) {
              map.removeLayer((layer as any)._measurementMarkers);
            }
            map.removeLayer(layer);
          } catch (err) {
            console.error("Failed to remove geoman layer:", err);
          }
        }, 10);
      }
    };

    map.on("pm:create", handleCreate);

    return () => {
      map.off("pm:create", handleCreate);
    };
  }, [map, openWaypointDialog, addRoute]);
};
