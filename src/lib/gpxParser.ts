export interface Waypoint {
  lat: number;
  lon: number;
  name: string;
}

export const parseGPX = (file: File): Promise<Waypoint[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const wpts = xmlDoc.getElementsByTagName("wpt");

        const points: Waypoint[] = [];
        for (let i = 0; i < wpts.length; i++) {
          const wpt = wpts[i];
          const lat = parseFloat(wpt.getAttribute("lat") || "0");
          const lon = parseFloat(wpt.getAttribute("lon") || "0");
          const name =
            wpt.getElementsByTagName("name")[0]?.textContent ||
            `Waypoint ${i + 1}`;
          points.push({ lat, lon, name });
        }

        resolve(points);
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
