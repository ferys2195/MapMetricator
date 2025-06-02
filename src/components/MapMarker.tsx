// components/MarkerAdd.tsx
import { Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { Button } from "./ui/button";
import { latLngToUtm } from "@/lib/geoUtils";
import { Trash2 } from "lucide-react";

// Atur ikon marker agar muncul
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler() {
  const { isAddingMarker, addMarker } = useMarkerStore();

  useMapEvents({
    click(e) {
      if (isAddingMarker) {
        addMarker(e.latlng);
        // add this if you want toggle off after 1 click:
        // useMarkerStore.getState().setAddingMarker(false);
      }
    },
  });

  return null;
}

export default function MapMarker() {
  const { markers, removeMarker } = useMarkerStore();

  return (
    <>
      <ClickHandler />
      {markers.map((position, idx) => (
        <Marker key={idx} position={position}>
          <Tooltip direction="top" offset={[-15, -15]} opacity={1} permanent>
            {String(++idx).padStart(3, "0")}
          </Tooltip>
          <Popup>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="">Marker - {String(idx).padStart(3, "0")}</label>
              <ul className="list-item font-mono text-sm">
                <li>
                  LatLng : {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </li>
                <li>
                  UTM :
                  {
                    latLngToUtm({
                      lat: position.lat,
                      lng: position.lng,
                    }).getAsString
                  }
                </li>
              </ul>
              <Button
                variant={"destructive"}
                size={"sm"}
                onClick={() => removeMarker(position)}
              >
                <Trash2 /> Delete Marker
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
