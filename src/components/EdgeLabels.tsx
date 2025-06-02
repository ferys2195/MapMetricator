import { Polyline, Tooltip } from "react-leaflet";
import * as turf from "@turf/turf";

interface EdgeLabelsProps {
  coords: [number, number][];
}

const EdgeLabels = ({ coords }: EdgeLabelsProps) => {
  return (
    <>
      {coords.map((point, i) => {
        const next = coords[(i + 1) % coords.length];
        const fromLatLng: [number, number] = [point[1], point[0]];
        const toLatLng: [number, number] = [next[1], next[0]];

        const from = turf.point(point);
        const to = turf.point(next);
        const length = turf.distance(from, to, { units: "meters" }).toFixed(0);

        const midLat = (point[1] + next[1]) / 2;
        const midLng = (point[0] + next[0]) / 2;

        return (
          <Polyline key={i} positions={[fromLatLng, toLatLng]}>
            <Tooltip permanent direction="center" position={[midLat, midLng]}>
              {length} m
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
};

export default EdgeLabels;
