import { LandPlot, MapPinPlus, Waypoints } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

import { ButtonGroup } from "@/components/ui/button-group";
import { useMapModeStore } from "@/stores/useMapModeStore";

export default function MeasureMenu() {
  const { mode, setMode } = useMapModeStore();
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

    if (mode !== "idle") {
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
        <Button
          variant={mode === "marker" ? "default" : "secondary"}
          size="icon"
          title="Add Marker"
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
          <Waypoints />
        </Button>
        <Button
          variant={mode === "polygone" ? "default" : "secondary"}
          size="icon"
          title="Draw Area"
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === "polygone" ? "idle" : "polygone");
          }}
        >
          <LandPlot />
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
