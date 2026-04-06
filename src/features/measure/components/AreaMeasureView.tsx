import {
  AreaLabel,
  LineAreaMeasure,
  MarkerAreaLabel,
} from "@/features/measure";
import { usePolygonStore } from "@/stores/polygonStore";

const AreaMeasureView = () => {
  const { polygonCoords } = usePolygonStore();
  if (polygonCoords.length < 3) return null;
  return (
    <>
      <AreaLabel coordinates={polygonCoords} />
      <MarkerAreaLabel coordinates={polygonCoords} />
      <LineAreaMeasure coordinates={polygonCoords} />
    </>
  );
};

export { AreaMeasureView };
