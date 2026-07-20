import { latLngToUtm } from "@/lib/geoUtils";
import { Marker, Popup, Tooltip } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { FlagTriangleRight, Trash2 } from "lucide-react";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { useMapModeStore } from "@/stores/useMapModeStore";

export default function MarkerItem({
  marker,
  title,
}: {
  marker: L.LatLng;
  title: string;
}) {
  const { removeMarker } = useMarkerStore();
  const { mode } = useMapModeStore();
  return (
    <Marker position={marker}>
      <Tooltip direction="top" offset={[-15, -15]} opacity={1} permanent>
        {title.padStart(3, "0")}
      </Tooltip>
      {mode === "marker" ||
        (mode === "idle" && (
          <Popup>
            <div className="flex flex-col gap-1.5">
              <div className="flex w-full items-center gap-x-1.5 border-b py-1">
                <FlagTriangleRight width={18} height={18} />{" "}
                <label className="text-[16px] font-bold">
                  {title.padStart(3, "0")}
                </label>
              </div>
              <ul className="list-item font-mono text-sm">
                <li>
                  LatLng : {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                </li>
                <li>UTM :{latLngToUtm(marker).getAsString}</li>
              </ul>
              <Button
                variant={"destructive"}
                size={"sm"}
                onClick={() => removeMarker(marker)}
              >
                <Trash2 /> Delete Marker
              </Button>
            </div>
          </Popup>
        ))}
    </Marker>
  );
}
