import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { usePolygonStore } from "@/stores/polygonStore";

const MapFlyTo = () => {
  const map = useMap();
  const { polygonCoords } = usePolygonStore();

  useEffect(() => {
    if (polygonCoords.length === 0) return;

    const [lng, lat] = polygonCoords[polygonCoords.length - 1];
    map.flyTo([lat, lng], map.getZoom()); // atau bisa tambahkan zoom baru misalnya 18
  }, [polygonCoords, map]);

  return null;
};

export default MapFlyTo;
