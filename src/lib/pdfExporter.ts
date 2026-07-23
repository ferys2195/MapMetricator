import jsPDF from "jspdf";
import { latLngToUtm, getLatitudeBand } from "./geoUtils";
import type { Route, Track } from "./gpxParser";

export interface PDFExportOptions {
  title?: string;
  paperSize?: "a4";
  orientation?: "portrait";
  customDate?: string;
}

interface UtmPoint {
  lat: number;
  lng: number;
  easting: number;
  northing: number;
  zoneNumber: number;
  band: string;
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
  let length = calculateNiceGridStep(targetScaleWidth, 1);
  
  if (length >= 1000) {
    return { length, unit: "km", divisions: 4 };
  }
  return { length, unit: "m", divisions: 4 };
};

export const renderUTMMapToCanvas = (
  segments: UtmPoint[][],
  title: string
): HTMLCanvasElement => {
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

  // 3. Extract all UTM points to compute Bounding Box (BBOX)
  const allPoints = segments.flat();
  if (allPoints.length === 0) return canvas;

  let minEasting = Infinity;
  let maxEasting = -Infinity;
  let minNorthing = Infinity;
  let maxNorthing = -Infinity;

  allPoints.forEach((pt) => {
    if (pt.easting < minEasting) minEasting = pt.easting;
    if (pt.easting > maxEasting) maxEasting = pt.easting;
    if (pt.northing < minNorthing) minNorthing = pt.northing;
    if (pt.northing > maxNorthing) maxNorthing = pt.northing;
  });

  const centerPt = allPoints[0];
  const zoneNumber = centerPt.zoneNumber;
  const bandLetter = centerPt.band;

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

  // Adjust aspect ratio to match map frame (uniform scale 1:1)
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

  // 4. Fill Map Background (Topographical Cream/Off-white background)
  ctx.fillStyle = "#FAF9E8"; // Light yellow/cream map tint
  ctx.fillRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // Coordinate Conversion Helpers (UTM to Canvas X/Y)
  const utmToCanvasX = (easting: number) => {
    return mapFrameLeft + ((easting - minEasting) / eastingSpan) * mapFrameWidth;
  };

  const utmToCanvasY = (northing: number) => {
    // Northing increases upwards, canvas Y increases downwards
    return mapFrameBottom - ((northing - minNorthing) / northingSpan) * mapFrameHeight;
  };

  // 5. Calculate Grid Interval (Auto-fit)
  const gridStep = calculateNiceGridStep(Math.max(eastingSpan, northingSpan), 5);

  const startGridEasting = Math.ceil(minEasting / gridStep) * gridStep;
  const startGridNorthing = Math.ceil(minNorthing / gridStep) * gridStep;

  // 6. Draw Dotted Grid Lines inside map frame
  ctx.strokeStyle = "#B0A88F"; // Dotted grid line color
  ctx.lineWidth = 1.5;
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

  // 8. Draw Border Coordinate Ticks & Labels
  ctx.fillStyle = "#000000";
  ctx.font = "bold 26px sans-serif";

  // Label: UTM WGS 84 Header Label (Top Left)
  ctx.fillText("UTM WGS 84", mapFrameLeft + 15, mapFrameTop + 35);

  // Easting Grid Labels (Top & Bottom Borders)
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const x = utmToCanvasX(e);
    if (x >= mapFrameLeft + 40 && x <= mapFrameRight - 40) {
      const eastingStr = `${zoneNumber} ${Math.round(e)}`;

      // Top Tick Label
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(eastingStr, x, mapFrameTop - 12);

      // Top Tick Line
      ctx.beginPath();
      ctx.moveTo(x, mapFrameTop);
      ctx.lineTo(x, mapFrameTop - 8);
      ctx.stroke();

      // Bottom Tick Label
      ctx.textBaseline = "top";
      ctx.fillText(eastingStr, x, mapFrameBottom + 12);

      // Bottom Tick Line
      ctx.beginPath();
      ctx.moveTo(x, mapFrameBottom);
      ctx.lineTo(x, mapFrameBottom + 8);
      ctx.stroke();
    }
  }

  // Northing Grid Labels (Left & Right Borders - Vertical Text)
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const y = utmToCanvasY(n);
    if (y >= mapFrameTop + 40 && y <= mapFrameBottom - 40) {
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
    ctx.strokeStyle = "#4ADE80"; // Bright Green Polyline Line (as in reference image)
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
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "24px sans-serif";
  ctx.fillText("Global Map", mapFrameLeft, footerTop);

  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title || "ukur", mapFrameLeft + 300, footerTop + 60);

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

    // Scale text value (0 m, 25 m, 50 m, 75 m, 100 m)
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

const convertPointsToUtm = (points: [number, number][]): UtmPoint[] => {
  return points.map(([lat, lng]) => {
    const utm = latLngToUtm({ lat, lng });
    const band = getLatitudeBand(lat);
    return {
      lat,
      lng,
      easting: utm.easting,
      northing: utm.northing,
      zoneNumber: utm.zoneNumber,
      band: band || "N",
    };
  });
};

export const exportRoutePDF = (route: Route, customTitle?: string) => {
  const pointsUtm = convertPointsToUtm(route.points);
  const title = customTitle || route.name || "Route Map";

  const canvas = renderUTMMapToCanvas([pointsUtm], title);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-utm-wgs84.pdf`;
  pdf.save(fileName);
};

export const exportTrackPDF = (track: Track, customTitle?: string) => {
  const segmentsUtm = track.segments.map((seg) => convertPointsToUtm(seg));
  const title = customTitle || track.name || "Track Map";

  const canvas = renderUTMMapToCanvas(segmentsUtm, title);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-utm-wgs84.pdf`;
  pdf.save(fileName);
};
