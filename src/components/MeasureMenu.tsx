import { LandPlot, MapPinPlus } from "lucide-react";
import { ButtonGroup } from "./ButtonGroup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import PolygonInput from "./PolygonInput";
import { Button } from "./ui/button";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

export default function MeasureMenu() {
  const { isAddingMarker, toggleAddingMarker } = useMarkerStore();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    function setCursor(cursor: string) {
      container.style.cursor = cursor;
      // Setting cursor ke semua elemen anak yang biasanya menutupi
      container.querySelectorAll("leaflet-container").forEach((el) => {
        (el as HTMLElement).style.cursor = cursor;
      });
    }

    if (isAddingMarker) {
      setCursor("crosshair");
    } else {
      setCursor("");
    }
  }, [isAddingMarker, map]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useMarkerStore.getState().setAddingMarker(false);
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
    <ButtonGroup>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"ghost"}
            size={"icon"}
            title="Ukur Bidang"
            className="rounded-none"
          >
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
              Mengukur bidang berdasarkan koordinat. masukan minimal 3 koordinat
            </DialogDescription>
          </DialogHeader>
          <PolygonInput />
        </DialogContent>
      </Dialog>
      <Button
        variant={isAddingMarker ? "default" : "ghost"}
        size="icon"
        title="Tambah Marker"
        className="rounded-none"
        onClick={(e) => {
          e.stopPropagation();
          toggleAddingMarker();
        }}
      >
        <MapPinPlus size={16} />
      </Button>
      {isAddingMarker && (
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
    </ButtonGroup>
  );
}
