import PolygonShape from "./PolygonShape";
import VertexMarkers from "./VertexMarkers";
import EdgeLabels from "./EdgeLabels";
import { usePolygonStore } from "@/stores/polygonStore";

const MapPolygon = () => {
  const { polygonCoords } = usePolygonStore();
  if (polygonCoords.length < 3) return null;
  return (
    <>
      <PolygonShape coords={polygonCoords} />
      <VertexMarkers coords={polygonCoords} />
      <EdgeLabels coords={polygonCoords} />
    </>
  );
};

export default MapPolygon;
