import { parseGPX, type Waypoint } from "@/lib/gpxParser";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { LatLng } from "leaflet";

export default function UploadGPX() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const { addMarker } = useMarkerStore();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseGPX(file);
      setWaypoints(result);
    } catch (err) {
      console.error("Failed to parse GPX file:", err);
    }
  };

  useEffect(() => {
    if (waypoints.length > 0) {
      waypoints.forEach((marker) => {
        addMarker(new LatLng(marker.lat, marker.lon));
      });
    }
  }, [waypoints, addMarker]);

  return (
    <div>
      <Input type="file" accept=".gpx" onChange={handleFileChange} />
    </div>
  );
}
