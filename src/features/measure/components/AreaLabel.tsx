import { Polygon, Tooltip } from "react-leaflet";
import * as turf from "@turf/turf";
import type { Coordinate } from "../types/coordinates.types";

const AreaLabel = ({ coordinates: coords }: Coordinate) => {
  const polygon = turf.polygon([[...coords, coords[0]]]);
  const area = turf.area(polygon);

  return (
    <Polygon
      positions={coords.map(([lng, lat]) => [lat, lng])}
      pathOptions={{ color: "blue" }}
    >
      <Tooltip permanent direction="center">
        <span className="text-xl font-semibold">
          {Number(area.toFixed(0)).toLocaleString("id-ID")} m²
        </span>
      </Tooltip>
    </Polygon>
  );
};

export { AreaLabel };
