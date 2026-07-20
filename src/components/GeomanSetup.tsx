import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";
import L from "leaflet";
import { useGeoStore } from "@/stores/useGeoStore";
import { latLngToUtm } from "@/lib/geoUtils";

const calculateUtmDistance = (p1: L.LatLng, p2: L.LatLng) => {
  const utm1 = latLngToUtm(p1);
  const utm2 = latLngToUtm(p2);
  return Math.sqrt(
    Math.pow(utm2.easting - utm1.easting, 2) + Math.pow(utm2.northing - utm1.northing, 2)
  );
};

const calculateUtmArea = (latlngs: L.LatLng[]) => {
  if (latlngs.length < 3) return 0;
  let area = 0;
  const utms = latlngs.map(latLngToUtm);
  for (let i = 0; i < utms.length; i++) {
    const j = (i + 1) % utms.length;
    area += utms[i].easting * utms[j].northing;
    area -= utms[j].easting * utms[i].northing;
  }
  return Math.abs(area / 2);
};

const getPoints = (latlngs: unknown): L.LatLng[] => {
  if (Array.isArray(latlngs) && latlngs.length > 0) {
    if (Array.isArray(latlngs[0])) {
      return getPoints(latlngs[0]);
    }
    return latlngs as L.LatLng[];
  }
  return [];
};

export default function GeomanSetup() {
  const map = useMap();
  const { addWaypoint } = useGeoStore();

  const measurementGroupRef = useRef<L.LayerGroup | null>(null);
  const activeWorkingLayerRef = useRef<any>(null);
  const drawingTypeRef = useRef<string>('');

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawCircleMarker: false,
      drawCircle: false,
      drawText: false,
      editControls: true,
      drawMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
    });

    if (!measurementGroupRef.current) {
      measurementGroupRef.current = L.layerGroup().addTo(map);
    }

    const clearDrawingMeasurements = () => {
      if (measurementGroupRef.current) {
        measurementGroupRef.current.clearLayers();
      }
    };

    const formatDistance = (meters: number): string => {
      if (meters < 1000) {
        return `${meters.toFixed(1)} m`;
      }
      return `${(meters / 1000).toFixed(2)} km`;
    };

    const updateDrawingMeasurements = (mouseLatLng?: L.LatLng) => {
      const workingLayer = activeWorkingLayerRef.current;
      if (!workingLayer || !measurementGroupRef.current) return;

      clearDrawingMeasurements();

      try {
        const rawLatLngs = workingLayer.getLatLngs ? workingLayer.getLatLngs() : [];
        let pts = getPoints(rawLatLngs);

        if (pts.length === 0 && mouseLatLng) return;

        const shape = drawingTypeRef.current || workingLayer.pm?.shape || workingLayer._shape || '';
        let segments: Array<[L.LatLng, L.LatLng]> = [];

        if (shape === 'Rectangle') {
          if (pts.length === 4) {
            segments.push([pts[0], pts[1]]);
            segments.push([pts[1], pts[2]]);
            segments.push([pts[2], pts[3]]);
            segments.push([pts[3], pts[0]]);
          } else if (pts.length >= 1 && mouseLatLng) {
            const p1 = pts[0];
            const p3 = mouseLatLng;
            const p2 = L.latLng(p1.lat, p3.lng);
            const p4 = L.latLng(p3.lat, p1.lng);
            segments.push([p1, p2], [p2, p3], [p3, p4], [p4, p1]);
          }
        } else if (shape === 'Polygon') {
          if (pts.length >= 1) {
            for (let i = 0; i < pts.length - 1; i++) {
              segments.push([pts[i], pts[i + 1]]);
            }
            if (mouseLatLng) {
              const lastPt = pts[pts.length - 1];
              const firstPt = pts[0];
              if (lastPt.distanceTo(mouseLatLng) > 0.5) {
                segments.push([lastPt, mouseLatLng]);
                if (firstPt.distanceTo(mouseLatLng) > 0.5) {
                  segments.push([mouseLatLng, firstPt]);
                }
              } else if (pts.length >= 2) {
                segments.push([lastPt, firstPt]);
              }
            } else if (pts.length >= 3) {
              segments.push([pts[pts.length - 1], pts[0]]);
            }
          }
        } else {
          if (pts.length >= 1) {
            for (let i = 0; i < pts.length - 1; i++) {
              segments.push([pts[i], pts[i + 1]]);
            }
            if (mouseLatLng) {
              const lastPt = pts[pts.length - 1];
              if (lastPt.distanceTo(mouseLatLng) > 0.5) {
                segments.push([lastPt, mouseLatLng]);
              }
            }
          }
        }

        segments.forEach(([pA, pB]) => {
          const dist = calculateUtmDistance(pA, pB);
          if (dist < 0.2) return;

          const formatted = formatDistance(dist);
          const midLat = (pA.lat + pB.lat) / 2;
          const midLng = (pA.lng + pB.lng) / 2;
          const pos = L.latLng(midLat, midLng);

          let angle = 0;
          const ptA = map.project(pA);
          const ptB = map.project(pB);
          angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
          if (angle > 90 || angle < -90) angle += 180;

          const labelIcon = L.divIcon({
            html: `
              <div style="display: flex; align-items: center; justify-content: center; pointer-events: none; transform: translate(-50%, -50%) rotate(${angle}deg);">
                <div style="font-size: 13px; font-weight: 800; white-space: nowrap; z-index: 1100; line-height: 1; color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
                  ${formatted}
                </div>
              </div>
            `,
            className: 'measurement-distance-tag',
            iconSize: [0, 0]
          });

          L.marker(pos, { icon: labelIcon, interactive: false }).addTo(measurementGroupRef.current!);
        });
      } catch (e) {
        console.error('Error drawing measurements:', e);
      }
    };

    map.on('pm:drawstart', (e: any) => {
      drawingTypeRef.current = e.shape;
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      clearDrawingMeasurements();
      map.getContainer().style.cursor = 'crosshair';
    });

    map.on('pm:drawend', () => {
      activeWorkingLayerRef.current = null;
      clearDrawingMeasurements();
      map.getContainer().style.cursor = '';
    });

    map.on('pm:workinglayercreated', (e: any) => {
      const workingLayer = e.workingLayer;
      activeWorkingLayerRef.current = workingLayer;
      updateDrawingMeasurements();

      workingLayer.on('pm:vertexadded', () => updateDrawingMeasurements());
      workingLayer.on('pm:vertexremoved', () => updateDrawingMeasurements());
      workingLayer.on('pm:snap', () => updateDrawingMeasurements());
      workingLayer.on('pm:unsnap', () => updateDrawingMeasurements());
    });

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (activeWorkingLayerRef.current) {
        updateDrawingMeasurements(e.latlng);
      }
    };
    map.on('mousemove', handleMouseMove);

    const renderLayerMeasurements = (layer: any) => {
      if (!layer._measurementMarkers) {
        layer._measurementMarkers = L.layerGroup().addTo(map);
      }
      const group = layer._measurementMarkers;
      group.clearLayers();

      const rawLatLngs = layer.getLatLngs ? layer.getLatLngs() : [];
      let pts = getPoints(rawLatLngs);
      if (pts.length < 2) return;

      const isRectangle = layer.pm?.shape === 'Rectangle' || layer._shape === 'Rectangle';
      const isPolygon = layer instanceof L.Polygon;
      const isPolyline = layer instanceof L.Polyline && !isPolygon;

      let segments: Array<[L.LatLng, L.LatLng]> = [];

      if (isRectangle) {
        if (pts.length === 4) {
          segments.push([pts[0], pts[1]]);
          segments.push([pts[1], pts[2]]);
          segments.push([pts[2], pts[3]]);
          segments.push([pts[3], pts[0]]);
        }
      } else if (isPolygon) {
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
        if (pts.length >= 3) {
          segments.push([pts[pts.length - 1], pts[0]]);
        }
      } else if (isPolyline) {
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
      }

      segments.forEach(([pA, pB]) => {
        const dist = calculateUtmDistance(pA, pB);
        if (dist < 0.2) return;

        const formatted = formatDistance(dist);
        const midLat = (pA.lat + pB.lat) / 2;
        const midLng = (pA.lng + pB.lng) / 2;
        const pos = L.latLng(midLat, midLng);

        let angle = 0;
        const ptA = map.project(pA);
        const ptB = map.project(pB);
        angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
        if (angle > 90 || angle < -90) angle += 180;

        const labelIcon = L.divIcon({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; pointer-events: none; transform: translate(-50%, -50%) rotate(${angle}deg);">
              <div style="font-size: 13px; font-weight: 800; white-space: nowrap; z-index: 1100; line-height: 1; color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
                ${formatted}
              </div>
            </div>
          `,
          className: 'measurement-distance-tag',
          iconSize: [0, 0]
        });

        L.marker(pos, { icon: labelIcon, interactive: false }).addTo(group);
      });
    };

    const updateTooltip = (layer: L.Layer) => {
      const polyLayer = layer as L.Polyline | L.Polygon;
      if (!polyLayer.getLatLngs) return;
      
      const latlngs = getPoints(polyLayer.getLatLngs());
      if (layer instanceof L.Polygon) {
        const area = calculateUtmArea(latlngs);
        layer.unbindTooltip();
        layer.bindTooltip(`<b>Area: ${area.toFixed(2)} m²</b>`, { permanent: true, direction: "center" }).openTooltip();
      } else if (layer instanceof L.Polyline) {
        let total = 0;
        let segmentsText = "";
        for (let i = 0; i < latlngs.length - 1; i++) {
          const dist = calculateUtmDistance(latlngs[i], latlngs[i + 1]);
          total += dist;
          if (latlngs.length <= 10) {
             segmentsText += `Seg ${i + 1}: ${dist.toFixed(2)}m<br>`;
          }
        }
        layer.unbindTooltip();
        layer.bindTooltip(`${segmentsText}<b>Total: ${total.toFixed(2)}m</b>`, { permanent: true, direction: "center" }).openTooltip();
      }
    };

    map.on("pm:create", (e) => {
      const { shape, layer } = e;

      if (shape === "Marker") {
        const latlng = (layer as L.Marker).getLatLng();
        const utm = latLngToUtm(latlng);
        const name = prompt(`Enter waypoint name:\nUTM: ${utm.getAsString}`, "New Waypoint");
        if (name) {
          addWaypoint({ lat: latlng.lat, lon: latlng.lng, name });
          layer.bindTooltip(name, { permanent: true, direction: "top" }).openTooltip();
        } else {
          map.removeLayer(layer);
        }
      } else {
        renderLayerMeasurements(layer);
        updateTooltip(layer);
        
        // Listen for edits
        layer.on("pm:edit", () => { updateTooltip(layer); renderLayerMeasurements(layer); });
        layer.on("pm:vertexadded", () => { updateTooltip(layer); renderLayerMeasurements(layer); });
        layer.on("pm:vertexremoved", () => { updateTooltip(layer); renderLayerMeasurements(layer); });
        layer.on("pm:markerdragend", () => { updateTooltip(layer); renderLayerMeasurements(layer); });
        layer.on("pm:dragend", () => { updateTooltip(layer); renderLayerMeasurements(layer); });
        
        // Clean up measurements if layer is deleted
        layer.on("pm:remove", () => {
          if ((layer as any)._measurementMarkers) {
             map.removeLayer((layer as any)._measurementMarkers);
          }
        });
      }
    });

    return () => {
      map.pm.removeControls();
      map.off("pm:create");
      map.off("pm:drawstart");
      map.off("pm:drawend");
      map.off("pm:workinglayercreated");
      map.off("mousemove", handleMouseMove);
      if (measurementGroupRef.current) {
        map.removeLayer(measurementGroupRef.current);
        measurementGroupRef.current = null;
      }
      map.getContainer().style.cursor = '';
    };
  }, [map, addWaypoint]);

  return null;
}
