import { CircleMarker, Tooltip } from "react-leaflet";

interface VertexMarkersProps {
  coords: [number, number][];
}

const VertexMarkers = ({ coords }: VertexMarkersProps) => {
  return (
    <>
      {coords.map(([lng, lat], idx) => (
        <CircleMarker
          key={idx}
          center={[lat, lng]}
          radius={5}
          pathOptions={{ color: "green" }}
        >
          <Tooltip permanent direction="top">
            P{idx + 1}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
};

export default VertexMarkers;
