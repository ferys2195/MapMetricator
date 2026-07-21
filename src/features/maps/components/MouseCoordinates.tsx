import { latLngToUtm } from "@/lib/geoUtils";
import { Crosshair } from "lucide-react";
import type { LatLng } from "leaflet";
import React from "react";
import { useMapEvents } from "react-leaflet";

function MouseCoordinates() {
  const [mousePoint, setMousePoint] = React.useState<LatLng | null>(null);

  const coordinate =
    mousePoint !== null &&
    latLngToUtm({ lat: mousePoint.lat, lng: mousePoint.lng });
  const formattedCoordinates = coordinate ? coordinate.getAsString : "";

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
    <div className="pointer-events-auto flex items-center rounded-full bg-background p-1 shadow-sm border border-border/50">
      <div className="flex items-center gap-2 px-3 py-1 text-muted-foreground">
        <Crosshair className="h-4 w-4" />
        <span className="text-[11px] font-bold tracking-widest">KURSOR:</span>
      </div>
      <div className="h-4 w-px bg-border/80"></div>
      <div className="flex items-center px-3 py-1 font-mono text-[13px] font-bold text-foreground w-[220px]">
        {formattedCoordinates ? (
          formattedCoordinates
        ) : (
          <span className="font-sans text-[13px] font-normal italic text-muted-foreground">
            Pindahkan kursor di atas peta
          </span>
        )}
      </div>
    </div>
  );
}

export default MouseCoordinates;
