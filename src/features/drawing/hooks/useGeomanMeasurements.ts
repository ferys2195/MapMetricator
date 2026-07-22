import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { getPoints, calculateUtmArea, calculateUtmDistance } from "../utils/measurements";
import { createMeasurementMarker } from "../utils/renderMeasurements";
import { getSegmentsFromPoints, getShapeType } from "../utils/shapeUtils";

export const useGeomanMeasurements = () => {
  const map = useMap();
  const measurementGroupRef = useRef<L.LayerGroup | null>(null);
  const activeWorkingLayerRef = useRef<any>(null);
  const drawingTypeRef = useRef<string>('');

  useEffect(() => {
    if (!measurementGroupRef.current) {
      measurementGroupRef.current = L.layerGroup().addTo(map);
    }

    const clearDrawingMeasurements = () => {
      if (measurementGroupRef.current) {
        measurementGroupRef.current.clearLayers();
      }
    };

    const updateDrawingMeasurements = (mouseLatLng?: L.LatLng) => {
      const workingLayer = activeWorkingLayerRef.current;
      if (!workingLayer || !measurementGroupRef.current) return;

      clearDrawingMeasurements();

      try {
        const rawLatLngs = workingLayer.getLatLngs ? workingLayer.getLatLngs() : [];
        let pts = getPoints(rawLatLngs);

        if (pts.length === 0 && mouseLatLng) return;

        const shape = drawingTypeRef.current || getShapeType(workingLayer);
        const segments = getSegmentsFromPoints(pts, shape, mouseLatLng);

        segments.forEach(([pA, pB]) => {
          const marker = createMeasurementMarker(map, pA, pB);
          if (marker) {
            marker.addTo(measurementGroupRef.current!);
          }
        });
      } catch (e) {
        console.error('Error drawing measurements:', e);
      }
    };

    const handleDrawStart = (e: any) => {
      drawingTypeRef.current = e.shape;
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      clearDrawingMeasurements();
      map.getContainer().style.cursor = 'crosshair';
    };

    const handleDrawEnd = () => {
      activeWorkingLayerRef.current = null;
      clearDrawingMeasurements();
      map.getContainer().style.cursor = '';
    };

    const handleWorkingLayerCreated = (e: any) => {
      const workingLayer = e.workingLayer;
      activeWorkingLayerRef.current = workingLayer;
      updateDrawingMeasurements();

      workingLayer.on('pm:vertexadded', () => updateDrawingMeasurements());
      workingLayer.on('pm:vertexremoved', () => updateDrawingMeasurements());
      workingLayer.on('pm:snap', () => updateDrawingMeasurements());
      workingLayer.on('pm:unsnap', () => updateDrawingMeasurements());
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (activeWorkingLayerRef.current) {
        updateDrawingMeasurements(e.latlng);
      }
    };

    map.on('pm:drawstart', handleDrawStart);
    map.on('pm:drawend', handleDrawEnd);
    map.on('pm:workinglayercreated', handleWorkingLayerCreated);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('pm:drawstart', handleDrawStart);
      map.off('pm:drawend', handleDrawEnd);
      map.off('pm:workinglayercreated', handleWorkingLayerCreated);
      map.off('mousemove', handleMouseMove);
      if (measurementGroupRef.current) {
        map.removeLayer(measurementGroupRef.current);
        measurementGroupRef.current = null;
      }
      map.getContainer().style.cursor = '';
    };
  }, [map]);
};

export const updateTooltip = (layer: L.Layer) => {
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

export const renderLayerMeasurements = (map: L.Map, layer: any) => {
  if (!layer._measurementMarkers) {
    layer._measurementMarkers = L.layerGroup().addTo(map);
  }
  const group = layer._measurementMarkers;
  group.clearLayers();

  const rawLatLngs = layer.getLatLngs ? layer.getLatLngs() : [];
  let pts = getPoints(rawLatLngs);
  if (pts.length < 2) return;

  const shape = getShapeType(layer);
  const segments = getSegmentsFromPoints(pts, shape);

  segments.forEach(([pA, pB]) => {
    const marker = createMeasurementMarker(map, pA, pB);
    if (marker) {
      marker.addTo(group);
    }
  });
};
