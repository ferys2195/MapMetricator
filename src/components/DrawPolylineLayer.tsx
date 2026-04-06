"use client";

import { Polyline, useMapEvents, useMap } from "react-leaflet";
import { useState } from "react";
import { useMapModeStore } from "@/stores/useMapModeStore";
import { useMarkerStore } from "@/stores/useMarkerStore";

type LatLng = [number, number];

export default function DrawPolylineLayer() {
  const [path, setPath] = useState<LatLng[]>([]);
  const [preview, setPreview] = useState<LatLng | null>(null);
  const [snapPoint, setSnapPoint] = useState<LatLng | null>(null);

  const { mode, setMode } = useMapModeStore();
  const { markers } = useMarkerStore();
  const map = useMap();

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

      // 🔥 kalau ada snap → pakai snap
      const finalPoint = snapPoint ?? clicked;

      setPath((prev) => [...prev, finalPoint]);
    },

    mousemove(e) {
      if (mode !== "polyline") return;
      if (path.length === 0) return;

      const current: LatLng = [e.latlng.lat, e.latlng.lng];

      const nearest = findNearestMarker(current);

      if (nearest) {
        setSnapPoint(nearest);
        setPreview(nearest);
      } else {
        setSnapPoint(null);
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

  const displayPath = preview && path.length > 0 ? [...path, preview] : path;

  return (
    <>
      {displayPath.length > 1 && (
        <Polyline
          positions={displayPath}
          dashArray={[10, 20]}
          color={snapPoint ? "#00b39b" : "#333"} // 🔥 visual snap
        />
      )}
    </>
  );
}
