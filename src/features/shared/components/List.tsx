import type L from "leaflet";
import { ListItem } from "./ListItem";

export interface ListProps {
  items: Array<{ id: number; marker: L.LatLng }>;
  onDelete?: (marker: L.LatLng) => void;
  format?: "card" | "compact";
  emptyMessage?: string;
}

/**
 * Generic List component for displaying collections of map points
 * Reusable for markers list, waypoints list, etc.
 */
export function List({
  items,
  onDelete,
  format = "compact",
  emptyMessage = "No items",
}: ListProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={format === "card" ? "space-y-2" : "space-y-1"}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          id={item.id}
          marker={item.marker}
          onDelete={onDelete}
          format={format}
        />
      ))}
    </div>
  );
}
