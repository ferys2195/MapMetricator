import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";

export const useGeomanControls = () => {
  const map = useMap();

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      oneBlock: true,
      drawCircleMarker: false,
      drawCircle: false,
      drawText: false,
      drawMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      editControls: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });

    return () => {
      map.pm.removeControls();
    };
  }, [map]);
};
