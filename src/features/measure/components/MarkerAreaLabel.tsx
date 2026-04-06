import { CircleMarker } from "react-leaflet";
import type { Coordinate } from "../types/coordinates.types";

const MarkerAreaLabel = ({ coordinates: coords }: Coordinate) => {
  return (
    <>
      {coords.map(([lng, lat], idx) => (
        <CircleMarker
          key={idx}
          center={[lat, lng]}
          radius={5}
          pathOptions={{ color: "green" }}
        ></CircleMarker>
      ))}
    </>
  );
};

export { MarkerAreaLabel };
