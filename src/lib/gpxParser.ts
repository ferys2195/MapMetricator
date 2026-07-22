export interface Waypoint {
  lat: number;
  lon: number;
  name: string;
}

export interface Track {
  id: string;
  name: string;
  segments: [number, number][][]; // array of segments, each segment is array of [lat, lon]
}

export interface Route {
  id: string;
  name: string;
  points: [number, number][]; // array of [lat, lon]
}

export interface GPXData {
  waypoints: Waypoint[];
  tracks: Track[];
  routes: Route[];
}

export const parseGPX = (file: File): Promise<GPXData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        // Verify parsing didn't fail
        if (xmlDoc.querySelector("parsererror")) {
          throw new Error("Invalid GPX format");
        }

        const waypoints: Waypoint[] = [];
        const wpts = xmlDoc.querySelectorAll("wpt");
        wpts.forEach((wpt, i) => {
          const lat = parseFloat(wpt.getAttribute("lat") || "0");
          const lon = parseFloat(wpt.getAttribute("lon") || "0");
          if (isNaN(lat) || isNaN(lon)) return;
          const name = wpt.querySelector("name")?.textContent || `Waypoint ${i + 1}`;
          waypoints.push({ lat, lon, name });
        });

        const tracks: Track[] = [];
        const trks = xmlDoc.querySelectorAll("trk");
        trks.forEach((trk, i) => {
          const name = trk.querySelector("name")?.textContent || `Track ${i + 1}`;
          const segments: [number, number][][] = [];
          const trksegs = trk.querySelectorAll("trkseg");
          trksegs.forEach((seg) => {
            const points: [number, number][] = [];
            const trkpts = seg.querySelectorAll("trkpt");
            trkpts.forEach((pt) => {
              const lat = parseFloat(pt.getAttribute("lat") || "0");
              const lon = parseFloat(pt.getAttribute("lon") || "0");
              if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon]);
            });
            if (points.length > 0) segments.push(points);
          });
          if (segments.length > 0) tracks.push({ id: `trk-${i}`, name, segments });
        });

        const routes: Route[] = [];
        const rtes = xmlDoc.querySelectorAll("rte");
        rtes.forEach((rte, i) => {
          const name = rte.querySelector("name")?.textContent || `Route ${i + 1}`;
          const points: [number, number][] = [];
          const rtepts = rte.querySelectorAll("rtept");
          rtepts.forEach((pt) => {
            const lat = parseFloat(pt.getAttribute("lat") || "0");
            const lon = parseFloat(pt.getAttribute("lon") || "0");
            if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon]);
          });
          if (points.length > 0) routes.push({ id: `rte-${i}`, name, points });
        });

        resolve({ waypoints, tracks, routes });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("File could not be read"));
    };

    reader.readAsText(file);
  });
};
