import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGeoStore } from "@/stores/useGeoStore";
import { latLngToUtm, getLatitudeBand } from "@/lib/geoUtils";
import { renderLayerMeasurements, updateTooltip } from "./useGeomanMeasurements";

export const useGeomanEvents = () => {
  const map = useMap();
  const { openWaypointDialog } = useGeoStore();

  useEffect(() => {
    const handleCreate = (e: any) => {
      const { shape, layer } = e;

      if (shape === "Marker") {
        const latlng = (layer as L.Marker).getLatLng();
        const utm = latLngToUtm(latlng);
        const band = getLatitudeBand(latlng.lat);
        const garminUtm = `${utm.zoneNumber}${band} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
        
        // Remove the geoman drawn layer since it will be rendered by GeoDataLayer once added
        map.removeLayer(layer);
        
        // Open the dialog with the pre-filled coordinates
        openWaypointDialog(garminUtm);
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
  }, [map, openWaypointDialog]);
};
