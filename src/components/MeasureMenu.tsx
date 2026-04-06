import { LandPlot, MapPinPlus, Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { latLngToUtm } from "@/lib/geoUtils";
import { Checkbox } from "./ui/checkbox";
import { Label } from "@radix-ui/react-dropdown-menu";
import { usePolygonStore } from "@/stores/polygonStore";
import { ButtonGroup } from "./ui/button-group";
import { useMapModeStore } from "@/stores/useMapModeStore";

export default function MeasureMenu() {
  const { markers } = useMarkerStore();
  const { mode, setMode } = useMapModeStore();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState<
    { lat: number; lng: number }[]
  >([]);
  const map = useMap();

  const { addCoord } = usePolygonStore();

  const addCoordinate = () => {
    selectedMarker.map((marker) => {
      addCoord([marker.lng, marker.lat]);
    });
  };

  useEffect(() => {
    const container = map.getContainer();
    function setCursor(cursor: string) {
      container.style.cursor = cursor;
      // Setting cursor ke semua elemen anak yang biasanya menutupi
      container.querySelectorAll("leaflet-container").forEach((el) => {
        (el as HTMLElement).style.cursor = cursor;
      });
    }

    if (mode === "marker") {
      setCursor("crosshair");
    } else {
      setCursor("");
    }
  }, [mode, map]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useMapModeStore.getState().setMode("idle");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX + 10, y: e.clientY + 10 });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  return (
    <>
      <ButtonGroup
        orientation="vertical"
        aria-label="Measure Menu"
        className="h-fit"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button size={"icon"} title="Ukur Bidang" variant={"secondary"}>
              <LandPlot size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="z-[9999] sm:max-w-[425px]"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Ukur Bidang</DialogTitle>
              <DialogDescription>
                Mengukur bidang berdasarkan koordinat. pilih minimal 3 koordinat
              </DialogDescription>
            </DialogHeader>
            <ul className="mb-5">
              {markers.map((marker, index) => (
                <li key={index}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={String(index)}
                      key={index}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Tambahkan marker ke array jika checkbox dicentang
                          setSelectedMarker((prev) => [
                            ...prev,
                            { lat: marker.lat, lng: marker.lng },
                          ]);
                        } else {
                          // Hapus marker dari array jika checkbox tidak dicentang
                          setSelectedMarker((prev) =>
                            prev.filter(
                              (m) =>
                                !(m.lat === marker.lat && m.lng === marker.lng),
                            ),
                          );
                        }
                      }}
                    />
                    <Label>
                      <code>
                        {String(++index).padStart(3, "0")}{" "}
                        {latLngToUtm(marker).getAsString}
                      </code>
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              disabled={selectedMarker.length < 3 ? true : false}
              onClick={() => {
                console.log(selectedMarker);
                addCoordinate();
              }}
            >
              Submit
            </Button>
          </DialogContent>
        </Dialog>
        <Button
          variant={mode === "marker" ? "default" : "secondary"}
          size="icon"
          title="Tambah Marker"
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === "marker" ? "idle" : "marker");
          }}
        >
          <MapPinPlus size={16} />
        </Button>
        <Button
          variant={mode === "polyline" ? "default" : "secondary"}
          size="icon"
          title="Draw Polyline"
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === "polyline" ? "idle" : "polyline");
          }}
        >
          <Ruler />
        </Button>
      </ButtonGroup>

      {mode !== "idle" && (
        <div
          style={{
            position: "fixed",
            top: cursorPos.y,
            left: cursorPos.x,
            background: "rgba(0, 0, 0, 0.75)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          Tekan ESC untuk stop
        </div>
      )}
    </>
  );
}
