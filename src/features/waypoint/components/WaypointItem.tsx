import { latLngToUtm } from "@/lib/geoUtils";
import type { Waypoint } from "../types/waypoint.types";
import { MapIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeoStore } from "@/stores/useGeoStore";

export function WaypointItem({ id, marker }: Waypoint) {
  const { removeWaypoint } = useGeoStore();
  return (
    <div className="hover:bg-secondary flex cursor-default items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-xs">
      <div>
        <div className="inline-flex items-center gap-2">
          <MapIcon size={14} /> <p>{String(id + 1).padStart(3, "0")} </p>
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-muted-foreground font-mono text-xs">
            {latLngToUtm(marker).getAsString}
          </span>
        </div>
      </div>
      <Button
        variant="destructive"
        size="icon-sm"
        onClick={() => removeWaypoint(id)}
        className="hidden group-hover:flex"
      >
        <Trash2 size={10} />
      </Button>
    </div>
  );
}
