import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGeoStore } from "@/stores/useGeoStore";
import { latLngToUtm } from "@/lib/geoUtils";
import { renderLayerMeasurements, updateTooltip } from "./useGeomanMeasurements";

export const useGeomanEvents = () => {
  const map = useMap();
  const { addWaypoint } = useGeoStore();

  useEffect(() => {
    const handleCreate = (e: any) => {
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
        renderLayerMeasurements(map, layer);
        updateTooltip(layer);
        
        // Listen for edits
        layer.on("pm:edit", () => { updateTooltip(layer); renderLayerMeasurements(map, layer); });
        layer.on("pm:vertexadded", () => { updateTooltip(layer); renderLayerMeasurements(map, layer); });
        layer.on("pm:vertexremoved", () => { updateTooltip(layer); renderLayerMeasurements(map, layer); });
        layer.on("pm:markerdragend", () => { updateTooltip(layer); renderLayerMeasurements(map, layer); });
        layer.on("pm:dragend", () => { updateTooltip(layer); renderLayerMeasurements(map, layer); });
        
        // Clean up measurements if layer is deleted
        layer.on("pm:remove", () => {
          if ((layer as any)._measurementMarkers) {
             map.removeLayer((layer as any)._measurementMarkers);
          }
        });
      }
    };

    map.on("pm:create", handleCreate);

    return () => {
      map.off("pm:create", handleCreate);
    };
  }, [map, addWaypoint]);
};
