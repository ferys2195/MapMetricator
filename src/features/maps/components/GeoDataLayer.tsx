import { useState } from "react";
import { useGeoStore } from "@/stores/useGeoStore";
import { Marker, Polyline, Tooltip, Popup, LayerGroup } from "react-leaflet";
import * as turf from "@turf/turf";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getLineDetails = (points: [number, number][]) => {
  const labels = [];
  let totalMeters = 0;
  const segmentStats: { len: number }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const pt1 = turf.point([p1[1], p1[0]]);
    const pt2 = turf.point([p2[1], p2[0]]);
    
    const dist = turf.distance(pt1, pt2, { units: 'meters' });
    totalMeters += dist;
    segmentStats.push({ len: dist });

    const mid = turf.midpoint(pt1, pt2);
    const bearing = turf.bearing(pt1, pt2);

    let rotation = bearing - 90;
    if (rotation > 90) rotation -= 180;
    else if (rotation < -90) rotation += 180;

    const iconHtml = `<div style="transform: translate(-50%, -50%) rotate(${rotation}deg); white-space: nowrap; font-weight: bold; font-size: 13px; color: black; text-shadow: 2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">
      ${dist >= 1000 ? (dist/1000).toFixed(2) + ' km' : dist.toFixed(1) + ' m'}
    </div>`;

    const icon = L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    labels.push(
      <Marker key={`seg-lbl-${i}`} position={[mid.geometry.coordinates[1], mid.geometry.coordinates[0]]} icon={icon} interactive={false} />
    );
  }
  return { labels, segmentStats, totalMeters };
};

export default function GeoDataLayer() {
  const { waypoints, routes, tracks } = useGeoStore();
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'track' | 'route'; segmentIdx?: number } | null>(null);

  return (
    <>
      {waypoints.map((wpt, idx) => (
        <Marker key={`wpt-${idx}`} position={[wpt.lat, wpt.lon]}>
          <Tooltip direction="top">{wpt.name}</Tooltip>
        </Marker>
      ))}

      {routes.map((route, idx) => {
        const isSelected = selectedItem?.type === 'route' && selectedItem.id === route.id;
        
        let details = null;
        if (isSelected && route.points.length > 1) {
          details = getLineDetails(route.points);
        }

        return (
          <LayerGroup key={route.id || `rte-container-${idx}`}>
            <Polyline 
              key={route.id || `rte-${idx}`} 
              positions={route.points} 
              pathOptions={{
                color: isSelected ? "#eab308" : "blue",
                weight: isSelected ? 5 : 3
              }}
              ref={(ref) => {
                if (ref && isSelected) {
                  ref.bringToFront();
                }
              }}
              eventHandlers={{
                click: () => setSelectedItem({ id: route.id, type: 'route' }),
                popupclose: () => setSelectedItem(null),
              }}
            >
              <Tooltip direction="center" sticky>{route.name}</Tooltip>
              <Popup>
                <div className="font-sans text-sm">
                  <div className="font-bold mb-1">{route.name}</div>
                  {details && (
                    <div className="font-bold mt-1">
                      Total: {details.totalMeters >= 1000 ? (details.totalMeters/1000).toFixed(2) + 'km' : details.totalMeters.toFixed(2) + 'm'}
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
            {details?.labels}
          </LayerGroup>
        );
      })}

      {tracks.flatMap((track, trackIdx) => 
        track.segments.map((segment, segIdx) => {
          const isSelected = selectedItem?.type === 'track' && selectedItem.id === track.id && selectedItem.segmentIdx === segIdx;
          
          let details = null;
          if (isSelected && segment.length > 1) {
            details = getLineDetails(segment);
          }

          return (
            <LayerGroup key={`${track.id || 'trk-' + trackIdx}-${segIdx}-container`}>
              <Polyline 
                key={`${track.id || 'trk-' + trackIdx}-${segIdx}`} 
                positions={segment} 
                pathOptions={{
                  color: isSelected ? "#eab308" : "red",
                  weight: isSelected ? 5 : 3
                }}
                ref={(ref) => {
                  if (ref && isSelected) {
                    ref.bringToFront();
                  }
                }}
                eventHandlers={{
                  click: () => setSelectedItem({ id: track.id, type: 'track', segmentIdx: segIdx }),
                  popupclose: () => setSelectedItem(null),
                }}
              >
                <Tooltip direction="center" sticky>
                  {track.name} {track.segments.length > 1 ? `- Segmen ${segIdx + 1}` : ''}
                </Tooltip>
                <Popup>
                  <div className="font-sans text-sm">
                    <div className="font-bold mb-1">{track.name} {track.segments.length > 1 ? `- Segmen ${segIdx + 1}` : ''}</div>
                    {details && (
                      <div className="font-bold mt-1">
                        Total: {details.totalMeters >= 1000 ? (details.totalMeters/1000).toFixed(2) + 'km' : details.totalMeters.toFixed(2) + 'm'}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
              {details?.labels}
            </LayerGroup>
          );
        })
      )}
    </>
  );
}
