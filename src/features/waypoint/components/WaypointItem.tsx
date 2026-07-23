import { latLngToUtm } from "@/lib/geoUtils";
import type { Waypoint as WaypointProps } from "../types/waypoint.types";
import { MapIcon, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeoStore } from "@/stores/useGeoStore";
import { exportWaypointGPX } from "@/lib/gpxExporter";

export function WaypointItem({ id, marker }: WaypointProps) {
  const { waypoints, removeWaypoint } = useGeoStore();
  const wpt = waypoints[id];

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wpt) {
      exportWaypointGPX(wpt);
    } else {
      exportWaypointGPX({
        lat: marker.lat,
        lon: marker.lng,
        name: `Waypoint ${String(id + 1).padStart(3, "0")}`
      });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeWaypoint(id);
  };

  return (
    <div className="group hover:bg-secondary flex cursor-default items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors">
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center gap-1.5 font-medium truncate w-full">
          <MapIcon size={14} className="shrink-0 text-muted-foreground" />
          <span className="truncate">{wpt?.name || `Waypoint ${String(id + 1).padStart(3, "0")}`}</span>
        </div>
        <div className="grid flex-1 text-left text-xs leading-tight mt-0.5">
          <span className="text-muted-foreground font-mono text-[11px]">
            {latLngToUtm(marker).getAsString}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleExport}
          title="Export GPX"
          className="h-7 w-7 p-0"
        >
          <Download size={12} />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={handleRemove}
          title="Hapus Waypoint"
          className="h-7 w-7 p-0"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
