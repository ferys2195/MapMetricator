// components/MapInstanceSaver.tsx
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { useMapInstanceStore } from "@/stores/useMapInstanceStore";

export default function MapInstanceSaver() {
  const map = useMap();
  const setMap = useMapInstanceStore((s) => s.setMap);

  useEffect(() => {
    setMap(map);
  }, [map, setMap]);

  return null;
}
