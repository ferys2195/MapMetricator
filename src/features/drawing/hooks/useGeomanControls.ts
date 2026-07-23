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

// Safelist Geoman CSS classes in JS array so Tailwind CSS v4 extracts them during production build
export const GEOMAN_ICON_CLASSES = [
  "leaflet-pm-toolbar",
  "leaflet-buttons-control-button",
  "control-icon",
  "control-fa-icon",
  "button-container",
  "leaflet-pm-actions-container",
  "leaflet-pm-action",
  "active-action",
  "pm-action-button-mode",
  "leaflet-pm-icon-marker",
  "leaflet-pm-icon-polygon",
  "leaflet-pm-icon-polyline",
  "leaflet-pm-icon-circle",
  "leaflet-pm-icon-circle-marker",
  "leaflet-pm-icon-rectangle",
  "leaflet-pm-icon-delete",
  "leaflet-pm-icon-edit",
  "leaflet-pm-icon-drag",
  "leaflet-pm-icon-cut",
  "leaflet-pm-icon-snapping",
  "leaflet-pm-icon-rotate",
  "leaflet-pm-icon-text",
  "pm-textarea",
  "pm-disabled",
  "pm-hasfocus",
  "leaflet-pm-touch-hint",
  "marker-icon",
  "marker-icon-middle",
  "leaflet-pm-draggable",
  "cursor-marker",
  "geoman-draw-cursor",
  "rect-style-marker",
  "rect-start-marker",
  "vertexmarker-disabled",
  "pm-text-marker",
];

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__geomanClasses = GEOMAN_ICON_CLASSES;
}



