import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";

export const useGeomanControls = () => {
  const map = useMap();

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

    return () => {
      map.pm.removeControls();
    };
  }, [map]);
};
