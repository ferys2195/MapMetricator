"use client";

import {
  Polyline,
  useMapEvents,
  useMap,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import { useMemo, useState } from "react";
import { useMapModeStore } from "@/stores/useMapModeStore";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { getClosestPointOnSegment } from "@/lib/geometry.utils";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

type LatLng = [number, number];

export default function DrawPolylineLayer() {
  const [path, setPath] = useState<LatLng[]>([]);
  const [preview, setPreview] = useState<LatLng | null>(null);
  const [snapPoint, setSnapPoint] = useState<LatLng | null>(null);
  const [lineSnapPoint, setLineSnapPoint] = useState<LatLng | null>(null);

  const { mode, setMode } = useMapModeStore();
  const { markers } = useMarkerStore();
  const map = useMap();

  const findClosestPointOnPath = (point: LatLng) => {
    if (path.length < 2) return null;

    let closest: LatLng | null = null;
    let minDist = Infinity;

    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];

      const projected = getClosestPointOnSegment(point, a, b);

      const dist = map.distance(
        { lat: point[0], lng: point[1] },
        { lat: projected[0], lng: projected[1] },
      );

      if (dist < minDist) {
        minDist = dist;
        closest = projected;
      }
    }

    if (minDist <= 20) {
      return closest;
    }

    return null;
  };

  const SNAP_DISTANCE = 20; // meter (bisa kamu tuning)

  // 🔥 cari marker terdekat
  const findNearestMarker = (point: LatLng) => {
    let nearest: LatLng | null = null;
    let minDist = Infinity;

    markers.forEach((m) => {
      const markerPoint: LatLng = [m.lat, m.lng];

      const dist = map.distance(
        { lat: point[0], lng: point[1] },
        { lat: markerPoint[0], lng: markerPoint[1] },
      );

      if (dist < minDist) {
        minDist = dist;
        nearest = markerPoint;
      }
    });

    if (minDist <= SNAP_DISTANCE) {
      return nearest;
    }

    return null;
  };

  useMapEvents({
    click(e) {
      if (mode !== "polyline") return;

      const clicked: LatLng = [e.latlng.lat, e.latlng.lng];

      const finalPoint = snapPoint ?? lineSnapPoint ?? clicked;

      setPath((prev) => [...prev, finalPoint]);
    },

    mousemove(e) {
      if (mode !== "polyline") return;
      if (path.length === 0) return;

      const current: LatLng = [e.latlng.lat, e.latlng.lng];

      const markerSnap = findNearestMarker(current);
      const lineSnap = findClosestPointOnPath(current);

      // 🔥 PRIORITAS: marker > line > free
      if (markerSnap) {
        setSnapPoint(markerSnap);
        setLineSnapPoint(null);
        setPreview(markerSnap);
      } else if (lineSnap) {
        setLineSnapPoint(lineSnap);
        setSnapPoint(null);
        setPreview(lineSnap);
      } else {
        setSnapPoint(null);
        setLineSnapPoint(null);
        setPreview(current);
      }
    },

    dblclick() {
      if (mode === "polyline") {
        setMode("idle");
        setPreview(null);
        setSnapPoint(null);
      }
    },
  });

  const displayPath = useMemo(() => {
    return mode === "polyline" && preview ? [...path, preview] : path;
  }, [mode, preview, path]);

  return (
    <>
      {displayPath.length > 1 &&
        displayPath.map((point, i) => {
          if (i === 0) return null;

          const prev = displayPath[i - 1];

          const dist = map.distance(
            { lat: prev[0], lng: prev[1] },
            { lat: point[0], lng: point[1] },
          );

          const mid: [number, number] = [
            (prev[0] + point[0]) / 2,
            (prev[1] + point[1]) / 2,
          ];

          return (
            <Polyline
              key={i}
              positions={[prev, point]}
              color={snapPoint ? "#00b39b" : "#333"}
            >
              <Tooltip permanent direction="center" position={mid}>
                {dist.toFixed(2)} m
              </Tooltip>
            </Polyline>
          );
        })}
      {path.length > 1 && (
        <Polyline positions={path} color={snapPoint ? "#00b39b" : "#333"}>
          <Popup>
            <div className="flex flex-col gap-1.5">
              <div className="border-b pb-1 font-bold">Polyline</div>

              <div className="font-mono text-sm">
                Total Waypoint: {path.length}
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setPath([]);
                  setPreview(null);
                  setSnapPoint(null);
                  setLineSnapPoint(null);
                  setMode("idle"); // 🔥 penting
                }}
              >
                <Trash2 size={14} /> Delete Polyline
              </Button>
            </div>
          </Popup>
        </Polyline>
      )}
      {lineSnapPoint && mode === "polyline" && (
        <CircleMarker center={lineSnapPoint} radius={5} />
      )}
    </>
  );
}
