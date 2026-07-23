# GPX Tool

> A web-based GIS utility for viewing GPX files, managing waypoints, calculating polygon land area, and converting UTM coordinates — inspired by MapSource, built for the modern web.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)](https://leafletjs.com/)

---

## 🗺️ Preview

![GPX Tool Screenshot](./screenshots/v1.1.0-beta.png)

---

## ✨ Key Features

- **📍 GPX File Support** — Load and visualize GPX tracks, routes, and waypoints on an interactive map.
- **🌐 UTM & Lat/Lng Coordinate Support** — Input, display, and convert coordinates in UTM (Universal Transverse Mercator) and Latitude/Longitude formats.
- **🖨️ Cartographic PDF Export (UTM WGS 84 Layout)** — Export Route & Track maps into print-ready PDF documents featuring:
  - Outer frame with Easting ($X$) and Northing ($Y$) UTM grid labels on all 4 margin borders (e.g. `49 M 708450`).
  - Unified reference projection to prevent spatial distortion across multi-zone routes.
  - Multi-basemap support (**Global Map**, **Esri Satellite Imagery**, and **OpenStreetMap**).
  - Essential cartographic elements: Scale Bar, True/Magnetic North Arrow declination indicator, and footer branding.
  - Automatic **Page 2+ Coordinate List Table** listing point indices, Lat/Lng, UTM Easting/Northing, segment distances, and cumulative totals.
- **📌 Waypoint Management** — Interactively add, view, edit, and organize waypoints via map clicks or structured sidebars.
- **📐 Polygon & Area Measurement** — Draw polygons and accurately calculate surface area and perimeter using `@turf/turf`.
- **✍️ Interactive Geoman Tools** — Full vector drawing and editing toolbar (shapes, polylines, markers, and edits) integrated directly onto Leaflet maps.
- **🗺️ Layer Switcher & Custom Controls** — Switch map tiles, track live mouse coordinates, and control map fly-to targets easily.
- **📄 GPX Export Options** — Export individual routes, tracks, waypoints, or full map sessions to standardized `.gpx` files.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Component-based UI framework |
| **TypeScript** | Type-safe development environment |
| **Vite** | Next-generation frontend build tool |
| **Leaflet & React-Leaflet** | Interactive mapping engine and React wrappers |
| **Leaflet Geoman** | Vector drawing, editing, and measurement toolbar |
| **jsPDF & html2canvas** | High-resolution PDF map layout & multi-page document generator |
| **Turf.js (`@turf/turf`)** | Advanced geospatial engine for area & distance calculations |
| **Proj4 (`proj4`)** | UTM coordinate system transformations and conversions |
| **Zustand** | Lightweight, high-performance state management |
| **Tailwind CSS v4** | Utility-first CSS styling system |
| **Radix UI & Lucide React** | Accessible UI primitives and modern iconography |

---

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ferys2195/gpx-tool.git
   cd gpx-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 📝 Note

The project architecture is continuously evolving with modular feature organization (waypoint, measure, drawing, export, map features).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
