import { Polygon, CircleMarker, Tooltip } from "react-leaflet";
import * as turf from "@turf/turf";
import type { Coordinate } from "../types/coordinates.types";

export type LabelType = "area" | "markers";

interface LabelProps extends Coordinate {
  type?: LabelType;
  color?: string;
}

/**
 * Generic Label component for displaying coordinates on the map
 * Supports both area polygon labels and marker point labels
 *
 * @param coordinates - Array of [lng, lat] coordinates
 * @param type - "area" for polygon with area label, "markers" for point markers
 * @param color - Color for the visualization (default: "blue" for area, "green" for markers)
 */
export function Label({
  coordinates: coords,
  type = "area",
  color,
}: LabelProps) {
  if (type === "area") {
    return <AreaLabel coordinates={coords} color={color} />;
  }

  if (type === "markers") {
    return <MarkerLabels coordinates={coords} color={color} />;
  }

  return null;
}

function AreaLabel({
  coordinates: coords,
  color = "blue",
}: Coordinate & { color?: string }) {
  const polygon = turf.polygon([[...coords, coords[0]]]);
  const area = turf.area(polygon);

  return (
    <Polygon
      positions={coords.map(([lng, lat]) => [lat, lng])}
      pathOptions={{ color }}
    >
      <Tooltip permanent direction="center">
        <span className="text-xl font-semibold">
          {Number(area.toFixed(0)).toLocaleString("id-ID")} m²
        </span>
      </Tooltip>
    </Polygon>
  );
}

function MarkerLabels({
  coordinates: coords,
  color = "green",
}: Coordinate & { color?: string }) {
  return (
    <>
      {coords.map(([lng, lat], idx) => (
        <CircleMarker
          key={idx}
          center={[lat, lng]}
          radius={5}
          pathOptions={{ color }}
        />
      ))}
    </>
  );
}
