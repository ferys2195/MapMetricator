"use client";

import {
  Polyline,
  useMapEvents,
  useMap,
  CircleMarker,
  Tooltip,
  Polygon,
} from "react-leaflet";
import { useState, useMemo, useEffect } from "react";
import { useMapModeStore } from "@/stores/useMapModeStore";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { getClosestPointOnSegment } from "@/lib/geometry.utils";
import * as turf from "@turf/turf";

type LatLng = [number, number];

export default function DrawPolygonLayer() {
  const [path, setPath] = useState<LatLng[]>([]);
  const [preview, setPreview] = useState<LatLng | null>(null);

  const { mode, setMode } = useMapModeStore();
  const { markers } = useMarkerStore();
  const map = useMap();

  const SNAP_DISTANCE = 20;

  // =========================
  // SNAP LOGIC (simple)
  // =========================
  const getSnapPoint = (point: LatLng): LatLng => {
    let nearest: LatLng | null = null;
    let minDist = Infinity;

    // snap ke marker
    markers.forEach((m) => {
      const p: LatLng = [m.lat, m.lng];
      const d = map.distance(
        { lat: point[0], lng: point[1] },
        { lat: p[0], lng: p[1] },
      );
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    });

    if (nearest && minDist <= SNAP_DISTANCE) return nearest;

    // snap ke line
    for (let i = 0; i < path.length - 1; i++) {
      const proj = getClosestPointOnSegment(point, path[i], path[i + 1]);
      const d = map.distance(
        { lat: point[0], lng: point[1] },
        { lat: proj[0], lng: proj[1] },
      );

      if (d < SNAP_DISTANCE) return proj;
    }

    return point;
  };

  // =========================
  // EVENTS
  // =========================
  useMapEvents({
    click(e) {
      if (mode !== "polygone") return;

      const p: LatLng = [e.latlng.lat, e.latlng.lng];
      setPath((prev) => [...prev, getSnapPoint(p)]);
    },

    mousemove(e) {
      if (mode !== "polygone" || path.length === 0) return;

      const p: LatLng = [e.latlng.lat, e.latlng.lng];
      setPreview(getSnapPoint(p));
    },

    dblclick() {
      if (mode === "polygone") {
        setMode("idle");
        setPreview(null);
      }
    },
  });

  useEffect(() => {
    if (mode !== "polygone") {
      setPreview(null);
    }
  }, [mode]);

  // =========================
  // DISPLAY PATH (LIVE)
  // =========================
  const displayPath = useMemo(() => {
    return mode === "polygone" && preview ? [...path, preview] : path;
  }, [mode, preview, path]);

  // =========================
  // AREA (TURF)
  // =========================
  const area = useMemo(() => {
    if (displayPath.length < 3) return 0;

    const coords = displayPath.map((p) => [p[1], p[0]]);
    coords.push([displayPath[0][1], displayPath[0][0]]);

    return turf.area(turf.polygon([coords]));
  }, [displayPath]);

  // =========================
  // CENTER
  // =========================
  const center = useMemo(() => {
    if (displayPath.length === 0) return null;

    const lat = displayPath.reduce((s, p) => s + p[0], 0) / displayPath.length;
    const lng = displayPath.reduce((s, p) => s + p[1], 0) / displayPath.length;

    return [lat, lng] as LatLng;
  }, [displayPath]);

  return (
    <>
      {/* ================= SEGMENTS ================= */}
      {displayPath.map((p, i) => {
        if (i === 0) return null;

        const prev = displayPath[i - 1];
        const dist = map.distance(
          { lat: prev[0], lng: prev[1] },
          { lat: p[0], lng: p[1] },
        );

        const mid: LatLng = [(prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2];

        return (
          <Polyline key={i} positions={[prev, p]} color="#fcba03">
            <Tooltip permanent position={mid}>
              {dist.toFixed(0)} m
            </Tooltip>
          </Polyline>
        );
      })}

      {/* ================= CLOSING LINE ================= */}
      {displayPath.length >= 3 &&
        (() => {
          const first = displayPath[0];
          const last = displayPath[displayPath.length - 1];

          const dist = map.distance(
            { lat: last[0], lng: last[1] },
            { lat: first[0], lng: first[1] },
          );

          const mid: LatLng = [
            (last[0] + first[0]) / 2,
            (last[1] + first[1]) / 2,
          ];

          return (
            <Polyline positions={[last, first]} color="#fcba03" dashArray="4">
              <Tooltip permanent position={mid}>
                {dist.toFixed(0)} m
              </Tooltip>
            </Polyline>
          );
        })()}

      {/* ================= POLYGON ================= */}
      {displayPath.length >= 3 && (
        <Polygon
          positions={displayPath}
          pathOptions={{ color: "#fcba03", fillOpacity: 0.2 }}
        >
          {center && (
            <Tooltip position={center} permanent direction="center">
              {(area / 10000).toFixed(3)} ha <br />
              {Number(area.toFixed(0)).toLocaleString("id-ID")} m²
            </Tooltip>
          )}
        </Polygon>
      )}

      {/* ================= VERTEX ================= */}
      {path.map((p, i) => (
        <CircleMarker color="#fcba03" key={i} center={p} radius={4} />
      ))}
    </>
  );
}
