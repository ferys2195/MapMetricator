import { useGeoStore } from "@/stores/useGeoStore";
import { Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function GeoDataLayer() {
  const { waypoints, routes, tracks } = useGeoStore();

  return (
    <>
      {waypoints.map((wpt, idx) => (
        <Marker key={`wpt-${idx}`} position={[wpt.lat, wpt.lon]}>
          <Tooltip direction="top">{wpt.name}</Tooltip>
        </Marker>
      ))}

      {routes.map((route, idx) => (
        <Polyline key={`rte-${idx}`} positions={route.points} color="blue">
          <Tooltip direction="center" sticky>{route.name}</Tooltip>
        </Polyline>
      ))}

      {tracks.map((track, idx) => (
        <Polyline key={`trk-${idx}`} positions={track.segments} color="red">
          <Tooltip direction="center" sticky>{track.name}</Tooltip>
        </Polyline>
      ))}
    </>
  );
}
