import type { Waypoint, Route, Track } from "./gpxParser";

const escapeXml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const downloadGPXFile = (filename: string, xmlContent: string) => {
  const blob = new Blob([xmlContent], { type: "application/gpx+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".gpx") ? filename : `${filename}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getHeader = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Tool - https://github.com/ferys2195/gpx-tool"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">`;
};

const getFooter = () => `</gpx>`;

const formatWaypointXml = (wpt: Waypoint) => {
  return `  <wpt lat="${wpt.lat}" lon="${wpt.lon}">
    <name>${escapeXml(wpt.name)}</name>
  </wpt>`;
};

const formatRouteXml = (route: Route) => {
  const ptsXml = route.points
    .map(([lat, lon]) => `    <rtept lat="${lat}" lon="${lon}" />`)
    .join("\n");
  return `  <rte>
    <name>${escapeXml(route.name)}</name>
${ptsXml}
  </rte>`;
};

const formatTrackXml = (track: Track) => {
  const segsXml = track.segments
    .map((seg) => {
      const trkpts = seg
        .map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}" />`)
        .join("\n");
      return `    <trkseg>\n${trkpts}\n    </trkseg>`;
    })
    .join("\n");
  return `  <trk>
    <name>${escapeXml(track.name)}</name>
${segsXml}
  </trk>`;
};

export const exportWaypointGPX = (wpt: Waypoint) => {
  const xml = `${getHeader()}\n${formatWaypointXml(wpt)}\n${getFooter()}`;
  downloadGPXFile(`${wpt.name || "waypoint"}.gpx`, xml);
};

export const exportRouteGPX = (route: Route) => {
  const xml = `${getHeader()}\n${formatRouteXml(route)}\n${getFooter()}`;
  downloadGPXFile(`${route.name || "route"}.gpx`, xml);
};

export const exportTrackGPX = (track: Track) => {
  const xml = `${getHeader()}\n${formatTrackXml(track)}\n${getFooter()}`;
  downloadGPXFile(`${track.name || "track"}.gpx`, xml);
};

export const exportGlobalGPX = (data: {
  waypoints: Waypoint[];
  routes: Route[];
  tracks: Track[];
}) => {
  const parts: string[] = [getHeader()];

  data.waypoints.forEach((w) => parts.push(formatWaypointXml(w)));
  data.routes.forEach((r) => parts.push(formatRouteXml(r)));
  data.tracks.forEach((t) => parts.push(formatTrackXml(t)));

  parts.push(getFooter());

  const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadGPXFile(`gpx-export-${dateStr}.gpx`, parts.join("\n"));
};
