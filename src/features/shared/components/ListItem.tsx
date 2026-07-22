import { latLngToUtm } from "@/lib/geoUtils";
import type L from "leaflet";
import { Trash2, MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ListItemProps {
  id: number;
  marker: L.LatLng;
  onDelete?: (marker: L.LatLng) => void;
  format?: "card" | "compact";
}

/**
 * Generic ListItem component for displaying map points
 * Reusable for markers, waypoints, and other point-based items
 *
 * @param id - Index/ID of the item
 * @param marker - LatLng object for the point
 * @param onDelete - Callback when delete button is clicked
 * @param format - Display format ("card" for full display, "compact" for minimal)
 */
export function ListItem({
  id,
  marker,
  onDelete,
  format = "compact",
}: ListItemProps) {
  if (format === "card") {
    return <CardFormat id={id} marker={marker} onDelete={onDelete} />;
  }

  return <CompactFormat id={id} marker={marker} onDelete={onDelete} />;
}

function CompactFormat({ id, marker, onDelete }: ListItemProps) {
  return (
    <div className="hover:bg-secondary group flex cursor-default items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-xs">
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
      {onDelete && (
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={() => onDelete(marker)}
          className="hidden group-hover:flex"
        >
          <Trash2 size={10} />
        </Button>
      )}
    </div>
  );
}

function CardFormat({ id, marker, onDelete }: ListItemProps) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 font-semibold">
          <MapIcon size={16} /> #{String(id + 1).padStart(3, "0")}
        </div>
        {onDelete && (
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(marker)}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
      <div className="font-mono text-sm">
        <div>Lat: {marker.lat.toFixed(6)}</div>
        <div>Lng: {marker.lng.toFixed(6)}</div>
        <div>UTM: {latLngToUtm(marker).getAsString}</div>
      </div>
    </div>
  );
}
