import { CircleMarker } from "react-leaflet";

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
        ></CircleMarker>
      ))}
    </>
  );
};

export default VertexMarkers;
