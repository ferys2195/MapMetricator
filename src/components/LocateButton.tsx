import { useGeolocationStore } from "@/stores/geolocationStore";
import { useMapInstanceStore } from "@/stores/useMapInstanceStore";
import { Button } from "./ui/button";
import { LocateFixed } from "lucide-react";

export function LocateButton() {
  const { getCurrentPosition, position } = useGeolocationStore();
  const map = useMapInstanceStore((s) => s.map);

  const handleClick = () => {
    getCurrentPosition();
    if (position && map) {
      map.flyTo([position.lat, position.lng], 17);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      title="Lokasi Saya"
    >
      <LocateFixed size={16} />
    </Button>
  );
}
