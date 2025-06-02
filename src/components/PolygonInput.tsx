import { useState } from "react";
import { usePolygonStore } from "@/stores/polygonStore"; // sesuaikan path jika perlu
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const PolygonInput = () => {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const { polygonCoords, addCoord, removeCoord } = usePolygonStore();

  const addCoordinate = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      addCoord([lngNum, latNum]); // leaflet format [lng, lat]
      setLat("");
      setLng("");
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <h3 className="text-sm font-semibold">Masukan Koordinat</h3>
      <input
        type="text"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        className="w-full rounded border px-2 py-1 text-sm"
      />
      <input
        type="text"
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        className="w-full rounded border px-2 py-1 text-sm"
      />
      <button
        onClick={addCoordinate}
        className="w-full rounded bg-blue-100 p-2 text-sm"
      >
        Tambah Titik
      </button>

      <ul className="space-y-1 text-xs">
        {polygonCoords.map(([lng, lat], i) => (
          <li key={i} className="space-y-2.5">
            <div className="flex w-full items-center justify-between rounded p-2 shadow">
              <code>
                {lat}, {lng}
              </code>
              <Button
                onClick={() => removeCoord(i)}
                variant={"outline"}
                size={"icon"}
                className={cn("rounded", "hover:cursor-pointer", "h-6 w-6")}
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PolygonInput;
