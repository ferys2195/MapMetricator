import jsPDF from "jspdf";
import * as turf from "@turf/turf";
import {
  getUtmZoneFromLongitude,
  getLatitudeBand,
  latLngToUtmWithZone,
  utmToLatLngWithZone,
} from "./geoUtils";
import type { Route, Track } from "./gpxParser";

export type BaseMapType = "global" | "esri" | "osm";

export interface PDFExportOptions {
  title?: string;
  paperSize?: "a4";
  orientation?: "portrait";
  customDate?: string;
  baseMap?: BaseMapType;
}

interface UtmPoint {
  lat: number;
  lng: number;
  easting: number;
  northing: number;
}

const calculateNiceGridStep = (range: number, targetTicks = 5): number => {
  if (range <= 0) return 100;
  const roughStep = range / targetTicks;
  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / Math.pow(10, exponent);

  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  const result = niceFraction * Math.pow(10, exponent);
  return Math.max(result, 10);
};

const calculateScaleBarLength = (mapWidthMeters: number): { length: number; unit: string; divisions: number } => {
  const targetScaleWidth = mapWidthMeters * 0.25; // Scale bar takes ~25% of map width
  const length = calculateNiceGridStep(targetScaleWidth, 1);
  
  if (length >= 1000) {
    return { length, unit: "km", divisions: 4 };
  }
  return { length, unit: "m", divisions: 4 };
};

// Web Mercator Tile Helpers
const lon2tile = (lon: number, zoom: number) => ((lon + 180) / 360) * Math.pow(2, zoom);
const lat2tile = (lat: number, zoom: number) => {
  const latRad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
};
const tile2lon = (x: number, z: number) => (x / Math.pow(2, z)) * 360 - 180;
const tile2lat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const loadTileImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 4000); // 4s timeout
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
};

export const renderUTMMapToCanvas = async (
  rawSegments: [number, number][][],
  title: string,
  baseMap: BaseMapType = "global"
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  // A4 Portrait high-resolution canvas at 10 pixels per mm (210mm x 297mm)
  const width = 2100;
  const height = 2970;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Background fill (clean document background)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // 2. Define Margins and Layout Frames (in pixels)
  const pageMargin = 90; // outer margin from canvas border
  
  // Draw outer page border line
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(pageMargin, pageMargin, width - 2 * pageMargin, height - 2 * pageMargin);

  // Map Inner Frame Bounding Area
  const mapFrameLeft = 240;
  const mapFrameTop = 220;
  const mapFrameRight = width - 240;
  const mapFrameBottom = height - 520;
  const mapFrameWidth = mapFrameRight - mapFrameLeft;
  const mapFrameHeight = mapFrameBottom - mapFrameTop;

  // 3. Extract all Lat/Lng points & Compute Unified Reference UTM Zone for the entire map
  const allLatLngs = rawSegments.flat();
  if (allLatLngs.length === 0) return canvas;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  allLatLngs.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Unified Reference UTM Zone & Hemisphere for ALL points in this map view
  const zoneNumber = getUtmZoneFromLongitude(centerLng);
  const hemisphere: "north" | "south" = centerLat >= 0 ? "north" : "south";
  const bandLetter = getLatitudeBand(centerLat) || "N";

  // Project all points into the UNIFIED Reference UTM Zone
  const segments: UtmPoint[][] = rawSegments.map((seg) =>
    seg.map(([lat, lng]) => {
      const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
      return { lat, lng, easting, northing };
    })
  );

  const allUtmPoints = segments.flat();

  let minEasting = Infinity;
  let maxEasting = -Infinity;
  let minNorthing = Infinity;
  let maxNorthing = -Infinity;

  allUtmPoints.forEach((pt) => {
    if (pt.easting < minEasting) minEasting = pt.easting;
    if (pt.easting > maxEasting) maxEasting = pt.easting;
    if (pt.northing < minNorthing) minNorthing = pt.northing;
    if (pt.northing > maxNorthing) maxNorthing = pt.northing;
  });

  // Add 12% padding around BBOX
  let eastingSpan = maxEasting - minEasting;
  let northingSpan = maxNorthing - minNorthing;
  if (eastingSpan === 0) eastingSpan = 200;
  if (northingSpan === 0) northingSpan = 200;

  const padEasting = eastingSpan * 0.12;
  const padNorthing = northingSpan * 0.12;

  minEasting -= padEasting;
  maxEasting += padEasting;
  minNorthing -= padNorthing;
  maxNorthing += padNorthing;

  eastingSpan = maxEasting - minEasting;
  northingSpan = maxNorthing - minNorthing;

  // Adjust aspect ratio to match map frame (uniform scale 1:1, no spatial distortion!)
  const frameAspect = mapFrameWidth / mapFrameHeight;
  const dataAspect = eastingSpan / northingSpan;

  if (dataAspect < frameAspect) {
    const targetEastingSpan = northingSpan * frameAspect;
    const diff = targetEastingSpan - eastingSpan;
    minEasting -= diff / 2;
    maxEasting += diff / 2;
    eastingSpan = targetEastingSpan;
  } else {
    const targetNorthingSpan = eastingSpan / frameAspect;
    const diff = targetNorthingSpan - northingSpan;
    minNorthing -= diff / 2;
    maxNorthing += diff / 2;
    northingSpan = targetNorthingSpan;
  }

  // 4. Fill Base Map Background
  ctx.fillStyle = baseMap === "global" ? "#FAF9E8" : "#E2E8F0"; // Cream default, neutral light gray fallback
  ctx.fillRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // Coordinate Conversion Helpers (UTM to Canvas X/Y)
  const utmToCanvasX = (easting: number) => {
    return mapFrameLeft + ((easting - minEasting) / eastingSpan) * mapFrameWidth;
  };

  const utmToCanvasY = (northing: number) => {
    return mapFrameBottom - ((northing - minNorthing) / northingSpan) * mapFrameHeight;
  };

  // 4b. Fetch & Render Tile Layers if baseMap is 'esri' or 'osm'
  if (baseMap === "esri" || baseMap === "osm") {
    // Unproject canvas frame corners back to Lat/Lng using Unified Reference Zone
    const topLeftLatLng = utmToLatLngWithZone(
      { easting: minEasting, northing: maxNorthing },
      zoneNumber,
      hemisphere
    );
    const bottomRightLatLng = utmToLatLngWithZone(
      { easting: maxEasting, northing: minNorthing },
      zoneNumber,
      hemisphere
    );

    const tileMinLat = Math.min(topLeftLatLng.lat, bottomRightLatLng.lat);
    const tileMaxLat = Math.max(topLeftLatLng.lat, bottomRightLatLng.lat);
    const tileMinLng = Math.min(topLeftLatLng.lng, bottomRightLatLng.lng);
    const tileMaxLng = Math.max(topLeftLatLng.lng, bottomRightLatLng.lng);

    const lngSpan = tileMaxLng - tileMinLng;
    const metersPerPixel = ((lngSpan * 111320 * Math.cos((centerLat * Math.PI) / 180)) / mapFrameWidth);
    const calculatedZoom = Math.floor(
      Math.log2((156543.03392 * Math.cos((centerLat * Math.PI) / 180)) / metersPerPixel)
    );
    const z = Math.min(Math.max(calculatedZoom, 2), baseMap === "esri" ? 17 : 18);

    const xMin = Math.floor(lon2tile(tileMinLng, z));
    const xMax = Math.floor(lon2tile(tileMaxLng, z));
    const yMin = Math.floor(lat2tile(tileMaxLat, z));
    const yMax = Math.floor(lat2tile(tileMinLat, z));

    const tilePromises: Array<{ x: number; y: number; promise: Promise<HTMLImageElement | null> }> = [];

    // Limit max tiles to 36 (6x6 grid)
    const subXMin = Math.max(xMin, xMin);
    const subXMax = Math.min(xMax, xMin + 6);
    const subYMin = Math.max(yMin, yMin);
    const subYMax = Math.min(yMax, yMin + 6);

    for (let x = subXMin; x <= subXMax; x++) {
      for (let y = subYMin; y <= subYMax; y++) {
        let url = "";
        if (baseMap === "osm") {
          url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        } else if (baseMap === "esri") {
          url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
        }
        tilePromises.push({ x, y, promise: loadTileImage(url) });
      }
    }

    const tileResults = await Promise.all(tilePromises.map((t) => t.promise));

    ctx.save();
    ctx.beginPath();
    ctx.rect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);
    ctx.clip();

    tilePromises.forEach((t, i) => {
      const img = tileResults[i];
      if (!img) return;

      const tLat1 = tile2lat(t.y, z);
      const tLon1 = tile2lon(t.x, z);
      const tLat2 = tile2lat(t.y + 1, z);
      const tLon2 = tile2lon(t.x + 1, z);

      const tUtm1 = latLngToUtmWithZone({ lat: tLat1, lng: tLon1 }, zoneNumber, hemisphere);
      const tUtm2 = latLngToUtmWithZone({ lat: tLat2, lng: tLon2 }, zoneNumber, hemisphere);

      const cx1 = utmToCanvasX(tUtm1.easting);
      const cy1 = utmToCanvasY(tUtm1.northing);
      const cx2 = utmToCanvasX(tUtm2.easting);
      const cy2 = utmToCanvasY(tUtm2.northing);

      const wTile = cx2 - cx1;
      const hTile = cy2 - cy1;

      ctx.drawImage(img, cx1, cy1, wTile, hTile);
    });

    ctx.restore();
  }

  // 5. Calculate Grid Interval (Auto-fit)
  const gridStep = calculateNiceGridStep(Math.max(eastingSpan, northingSpan), 5);

  const startGridEasting = Math.ceil(minEasting / gridStep) * gridStep;
  const startGridNorthing = Math.ceil(minNorthing / gridStep) * gridStep;

  // 6. Draw Dotted Grid Lines inside map frame
  ctx.strokeStyle = baseMap === "esri" ? "#FFFFFF" : "#B0A88F"; // White on Satellite, brownish on others
  ctx.lineWidth = baseMap === "esri" ? 1.8 : 1.5;
  ctx.setLineDash([4, 6]);

  // Vertical Grid Lines
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const x = utmToCanvasX(e);
    if (x >= mapFrameLeft && x <= mapFrameRight) {
      ctx.beginPath();
      ctx.moveTo(x, mapFrameTop);
      ctx.lineTo(x, mapFrameBottom);
      ctx.stroke();
    }
  }

  // Horizontal Grid Lines
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const y = utmToCanvasY(n);
    if (y >= mapFrameTop && y <= mapFrameBottom) {
      ctx.beginPath();
      ctx.moveTo(mapFrameLeft, y);
      ctx.lineTo(mapFrameRight, y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]); // Reset dash

  // 7. Draw Map Frame Inner Border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.strokeRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // 8. Draw Header Label inside Map Frame
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillRect(mapFrameLeft + 10, mapFrameTop + 10, 190, 38);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("UTM WGS 84", mapFrameLeft + 22, mapFrameTop + 29);
  ctx.restore();

  // Draw Border Coordinate Ticks & Labels (on white page margins)
  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px sans-serif";

  // Easting Grid Labels (Top & Bottom Horizontal Borders)
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const x = utmToCanvasX(e);
    if (x >= mapFrameLeft + 10 && x <= mapFrameRight - 10) {
      // Easting format with UTM Zone Number & Band prefix (e.g. "49 M 708450")
      const eastingStr = `${zoneNumber} ${bandLetter} ${Math.round(e)}`;

      // Top Horizontal Tick Label
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(eastingStr, x, mapFrameTop - 12);

      // Top Tick Line
      ctx.beginPath();
      ctx.moveTo(x, mapFrameTop);
      ctx.lineTo(x, mapFrameTop - 8);
      ctx.stroke();

      // Bottom Horizontal Tick Label
      ctx.textBaseline = "top";
      ctx.fillText(eastingStr, x, mapFrameBottom + 12);

      // Bottom Tick Line
      ctx.beginPath();
      ctx.moveTo(x, mapFrameBottom);
      ctx.lineTo(x, mapFrameBottom + 8);
      ctx.stroke();
    }
  }

  // Northing Grid Labels (Left & Right Vertical Borders)
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const y = utmToCanvasY(n);
    if (y >= mapFrameTop + 10 && y <= mapFrameBottom - 10) {
      // Northing format with UTM Zone & Band (e.g. "49 M 9751100")
      const northingStr = `${zoneNumber} ${bandLetter} ${Math.round(n)}`;

      // Left Border Label (Rotated 90 degrees CCW)
      ctx.save();
      ctx.translate(mapFrameLeft - 16, y);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(northingStr, 0, 0);
      ctx.restore();

      // Left Tick Line
      ctx.beginPath();
      ctx.moveTo(mapFrameLeft, y);
      ctx.lineTo(mapFrameLeft - 8, y);
      ctx.stroke();

      // Right Border Label (Rotated 90 degrees CW)
      ctx.save();
      ctx.translate(mapFrameRight + 16, y);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(northingStr, 0, 0);
      ctx.restore();

      // Right Tick Line
      ctx.beginPath();
      ctx.moveTo(mapFrameRight, y);
      ctx.lineTo(mapFrameRight + 8, y);
      ctx.stroke();
    }
  }

  // 9. Draw Track / Route Segments (Lines + Vertices)
  segments.forEach((segment) => {
    if (segment.length === 0) return;

    // Draw Outer Highlight Line
    ctx.strokeStyle = "#15803D"; // Dark Green Border
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    segment.forEach((pt, idx) => {
      const x = utmToCanvasX(pt.easting);
      const y = utmToCanvasY(pt.northing);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Inner Bright Polyline Line
    ctx.strokeStyle = "#4ADE80"; // Bright Green Polyline Line
    ctx.lineWidth = 6;
    ctx.beginPath();
    segment.forEach((pt, idx) => {
      const x = utmToCanvasX(pt.easting);
      const y = utmToCanvasY(pt.northing);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Vertex Dots
    segment.forEach((pt) => {
      const x = utmToCanvasX(pt.easting);
      const y = utmToCanvasY(pt.northing);

      // Black filled vertex dot
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fill();

      // Small inner white highlight
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    });
  });

  // 10. Footer Cartographic Elements Area
  const footerTop = mapFrameBottom + 50;

  // Subtitle / Map Title Label (Bottom Left)
  const mapTypeLabel = baseMap === "esri" ? "Esri Satellite Map" : baseMap === "osm" ? "OpenStreetMap" : "Global Map";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "24px sans-serif";
  ctx.fillText(mapTypeLabel, mapFrameLeft, footerTop);

  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title || "ukur", mapFrameLeft + 320, footerTop + 60);

  // 11. Scale Bar & Compass North Arrow (Bottom Right Footer Area)
  const scaleInfo = calculateScaleBarLength(eastingSpan);
  const scaleLengthPx = (scaleInfo.length / eastingSpan) * mapFrameWidth;
  const scaleRight = mapFrameRight - 220;
  const scaleLeft = scaleRight - scaleLengthPx;
  const scaleY = footerTop + 50;

  // Draw Scale Bar Baseline
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(scaleLeft, scaleY);
  ctx.lineTo(scaleRight, scaleY);
  ctx.stroke();

  // Draw Scale Divisions
  const stepPx = scaleLengthPx / scaleInfo.divisions;
  const valStep = scaleInfo.length / scaleInfo.divisions;

  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  for (let i = 0; i <= scaleInfo.divisions; i++) {
    const x = scaleLeft + i * stepPx;
    const val = Math.round(i * valStep);

    // Division tick mark
    ctx.beginPath();
    ctx.moveTo(x, scaleY - 8);
    ctx.lineTo(x, scaleY + 8);
    ctx.stroke();

    // Scale text value
    const label = i === scaleInfo.divisions ? `${val} ${scaleInfo.unit}` : `${val} m`;
    ctx.fillText(label, x, scaleY - 12);
  }

  // 12. Draw North Arrow (TN / MN Compass Indicator)
  const compassX = mapFrameRight - 70;
  const compassY = footerTop + 45;

  ctx.lineWidth = 3;
  // TN Line (True North)
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + 30);
  ctx.lineTo(compassX, compassY - 30);
  ctx.stroke();

  // Arrow tip
  ctx.beginPath();
  ctx.moveTo(compassX - 6, compassY - 20);
  ctx.lineTo(compassX, compassY - 32);
  ctx.lineTo(compassX + 6, compassY - 20);
  ctx.stroke();

  // TN Label
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("TN", compassX - 10, compassY - 28);

  // MN Label
  ctx.textAlign = "left";
  ctx.fillText("MN", compassX + 10, compassY - 28);

  // Declination angle text
  ctx.font = "14px sans-serif";
  ctx.fillText("1.1°", compassX + 10, compassY);

  // 13. Garmin Branding & Date Stamp (Bottom Right Corner)
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("GARMIN.", mapFrameRight, footerTop + 120);

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  ctx.font = "16px sans-serif";
  ctx.fillText(dateStr, mapFrameRight, footerTop + 165);

  return canvas;
};

// Render Page 2+ Coordinate Tables
export const renderCoordinateTableCanvases = (
  rawSegments: [number, number][][],
  title: string
): HTMLCanvasElement[] => {
  const allLatLngs = rawSegments.flat();
  if (allLatLngs.length === 0) return [];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  allLatLngs.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const zoneNumber = getUtmZoneFromLongitude(centerLng);
  const hemisphere: "north" | "south" = centerLat >= 0 ? "north" : "south";
  const bandLetter = getLatitudeBand(centerLat) || "N";

  let cumDistance = 0;
  const pointRows = allLatLngs.map(([lat, lng], idx) => {
    let segDist = 0;
    if (idx > 0) {
      const [prevLat, prevLng] = allLatLngs[idx - 1];
      const p1 = turf.point([prevLng, prevLat]);
      const p2 = turf.point([lng, lat]);
      segDist = turf.distance(p1, p2, { units: "meters" });
      cumDistance += segDist;
    }
    const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
    return {
      index: idx + 1,
      lat,
      lng,
      easting,
      northing,
      segDist,
      cumDistance,
    };
  });

  const rowsPerPage = 38;
  const totalPages = Math.ceil(pointRows.length / rowsPerPage);
  const canvases: HTMLCanvasElement[] = [];

  for (let page = 0; page < totalPages; page++) {
    const canvas = document.createElement("canvas");
    const width = 2100;
    const height = 2970;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // Background & Page Border
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    const pageMargin = 90;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(pageMargin, pageMargin, width - 2 * pageMargin, height - 2 * pageMargin);

    // Header Title Area
    const startX = 140;
    let startY = 160;

    ctx.fillStyle = "#0F172A"; // Dark slate header text
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("DAFTAR KOORDINAT LINTASAN", startX, startY);

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`Nama: ${title}`, startX, startY + 50);
    ctx.fillText(
      `Proyeksi: UTM Zone ${zoneNumber} ${bandLetter} (${hemisphere.toUpperCase()}) | Datum: WGS 84`,
      startX,
      startY + 90
    );

    // Date & Page Indicator (Top Right)
    ctx.textAlign = "right";
    ctx.font = "20px sans-serif";
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    ctx.fillText(`Tanggal: ${dateStr}`, width - startX, startY + 50);
    ctx.fillText(`Halaman ${page + 2} dari ${totalPages + 1}`, width - startX, startY + 90);

    // Table Header
    startY += 150;
    const tableWidth = width - 2 * startX;
    const colWidths = [100, 260, 260, 310, 320, 280, 290]; // 7 columns
    const colAligns: Array<CanvasTextAlign> = ["center", "right", "right", "right", "right", "right", "right"];
    const headers = [
      "No",
      "Latitude (°)",
      "Longitude (°)",
      "Easting X (m)",
      "Northing Y (m)",
      "Segmen (m)",
      "Total (m)",
    ];

    const rowHeight = 52;

    // Draw Table Header Box
    ctx.fillStyle = "#1E293B"; // Dark blue-slate header
    ctx.fillRect(startX, startY, tableWidth, rowHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px sans-serif";
    ctx.textBaseline = "middle";

    let currentX = startX;
    headers.forEach((h, i) => {
      const w = colWidths[i];
      const align = colAligns[i];
      ctx.textAlign = align;
      let textX = currentX + w / 2;
      if (align === "right") textX = currentX + w - 15;
      else if (align === "left") textX = currentX + 15;

      ctx.fillText(h, textX, startY + rowHeight / 2);
      currentX += w;
    });

    startY += rowHeight;

    // Table Data Rows
    const pageRows = pointRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    ctx.font = "19px sans-serif";

    pageRows.forEach((row, rIdx) => {
      // Zebra striping
      ctx.fillStyle = rIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
      ctx.fillRect(startX, startY, tableWidth, rowHeight);

      // Grid line border below row
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY + rowHeight);
      ctx.lineTo(startX + tableWidth, startY + rowHeight);
      ctx.stroke();

      // Row values
      const vals = [
        `${row.index}`,
        row.lat.toFixed(6),
        row.lng.toFixed(6),
        row.easting.toFixed(2),
        row.northing.toFixed(2),
        row.index === 1 ? "-" : row.segDist >= 1000 ? `${(row.segDist / 1000).toFixed(2)} km` : `${row.segDist.toFixed(1)} m`,
        row.cumDistance >= 1000 ? `${(row.cumDistance / 1000).toFixed(2)} km` : `${row.cumDistance.toFixed(1)} m`,
      ];

      ctx.fillStyle = "#0F172A";
      let cX = startX;
      vals.forEach((v, cIdx) => {
        const w = colWidths[cIdx];
        const align = colAligns[cIdx];
        ctx.textAlign = align;
        let textX = cX + w / 2;
        if (align === "right") textX = cX + w - 15;
        else if (align === "left") textX = cX + 15;

        ctx.fillText(v, textX, startY + rowHeight / 2);
        cX += w;
      });

      startY += rowHeight;
    });

    // Draw Outer Table Border
    const tableTotalHeight = rowHeight * (pageRows.length + 1);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY - tableTotalHeight, tableWidth, tableTotalHeight);

    canvases.push(canvas);
  }

  return canvases;
};

export const exportRoutePDF = async (route: Route, customTitle?: string, baseMap: BaseMapType = "global") => {
  const title = customTitle || route.name || "Route Map";

  // 1. Generate Page 1: Map Layout
  const mapCanvas = await renderUTMMapToCanvas([route.points], title, baseMap);

  // 2. Generate Page 2+: Coordinate Tables
  const tableCanvases = renderCoordinateTableCanvases([route.points], title);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page 1: Map
  const mapImg = mapCanvas.toDataURL("image/png");
  pdf.addImage(mapImg, "PNG", 0, 0, 210, 297);

  // Page 2+: Tables
  tableCanvases.forEach((tCanvas) => {
    pdf.addPage();
    const tImg = tCanvas.toDataURL("image/png");
    pdf.addImage(tImg, "PNG", 0, 0, 210, 297);
  });

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-utm-wgs84.pdf`;
  pdf.save(fileName);
};

export const exportTrackPDF = async (track: Track, customTitle?: string, baseMap: BaseMapType = "global") => {
  const title = customTitle || track.name || "Track Map";

  // 1. Generate Page 1: Map Layout
  const mapCanvas = await renderUTMMapToCanvas(track.segments, title, baseMap);

  // 2. Generate Page 2+: Coordinate Tables
  const tableCanvases = renderCoordinateTableCanvases(track.segments, title);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page 1: Map
  const mapImg = mapCanvas.toDataURL("image/png");
  pdf.addImage(mapImg, "PNG", 0, 0, 210, 297);

  // Page 2+: Tables
  tableCanvases.forEach((tCanvas) => {
    pdf.addPage();
    const tImg = tCanvas.toDataURL("image/png");
    pdf.addImage(tImg, "PNG", 0, 0, 210, 297);
  });

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-utm-wgs84.pdf`;
  pdf.save(fileName);
};
