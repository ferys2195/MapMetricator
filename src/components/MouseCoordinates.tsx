import { latLngToUtm } from "@/lib/geoUtils";
import type { LatLng } from "leaflet";
import React from "react";
import { useMapEvents } from "react-leaflet";

function MouseCoordinates() {
  const [mousePoint, setMousePoint] = React.useState<LatLng | null>(null);

  const coordinate =
    mousePoint !== null &&
    latLngToUtm({ lat: mousePoint.lat, lng: mousePoint.lng });
  const formattedCoordinates = coordinate.getAsString;

  React.useEffect(
    function copyToClipboard() {
      function handleCtrlCKeydown(event: KeyboardEvent) {
        if (
          event.key === "c" &&
          event.ctrlKey &&
          formattedCoordinates.length > 0 &&
          navigator.clipboard
        ) {
          navigator.clipboard.writeText(formattedCoordinates);
        }
      }

      document.addEventListener("keydown", handleCtrlCKeydown);

      return function cleanup() {
        document.removeEventListener("keydown", handleCtrlCKeydown);
      };
    },
    [formattedCoordinates],
  );

  useMapEvents({
    mousemove(event) {
      setMousePoint(event.latlng);
    },
    mouseout() {
      setMousePoint(null);
    },
  });

  return (
    <div className="rounded bg-white/50 px-2.5 py-1">
      {formattedCoordinates}
    </div>
  );
}

export default MouseCoordinates;
