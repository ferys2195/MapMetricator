import { parseGPX } from "@/lib/gpxParser";
import { Input } from "./ui/input";
import { useGeoStore } from "@/stores/useGeoStore";

export default function UploadGPX() {
  const { setWaypoints, setTracks, setRoutes } = useGeoStore();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseGPX(file);
      setWaypoints(data.waypoints);
      setTracks(data.tracks);
      setRoutes(data.routes);
    } catch (err) {
      console.error("Failed to parse GPX file:", err);
    }
  };

  return (
    <div>
      <Input type="file" accept=".gpx" onChange={handleFileChange} />
    </div>
  );
}
