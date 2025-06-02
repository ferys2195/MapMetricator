import { Polygon, Tooltip } from "react-leaflet";
import * as turf from "@turf/turf";

interface PolygonShapeProps {
  coords: [number, number][];
}

const PolygonShape = ({ coords }: PolygonShapeProps) => {
  const polygon = turf.polygon([[...coords, coords[0]]]);
  const area = turf.area(polygon);

  return (
    <Polygon
      positions={coords.map(([lng, lat]) => [lat, lng])}
      pathOptions={{ color: "blue" }}
    >
      <Tooltip permanent direction="center">
        {area.toFixed(0)} m²
      </Tooltip>
    </Polygon>
  );
};

export default PolygonShape;
