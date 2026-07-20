import L from "leaflet";

export const getSegmentsFromPoints = (pts: L.LatLng[], shape: string, mouseLatLng?: L.LatLng): Array<[L.LatLng, L.LatLng]> => {
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
    // Polyline / Line
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

  return segments;
};

export const getShapeType = (layer: any): string => {
  if (layer.pm?.shape) return layer.pm.shape;
  if (layer._shape) return layer._shape;
  if (layer instanceof L.Polygon) return 'Polygon';
  if (layer instanceof L.Polyline) return 'Line';
  return '';
};
