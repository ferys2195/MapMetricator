import { MapContainer } from "react-leaflet";
import MapFlyTo from "./MapFlyTo";
import MapPolygon from "./MapPolygon";
import { useGeolocationStore } from "@/stores/geolocationStore";
import { useEffect } from "react";
import MapMarker from "./MapMarker";
import MapInstanceSaver from "./MapInstanceSaver";

export default function MainMap({ children }: { children?: React.ReactNode }) {
  const { position, error, isLoading, getCurrentPosition } =
    useGeolocationStore();
  const defaultCenter = [-6.193096, 106.823504] as [number, number];

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  if (isLoading) {
    return <div>Loading your location...</div>;
  }

  if (error) {
    console.error("Geolocation error:", error);
    return (
      <MapContainer
        center={defaultCenter}
        zoom={20}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        {children}
        <MapInstanceSaver />
        <MapMarker />
        <MapPolygon />
        <MapFlyTo />
      </MapContainer>
    );
  }

  const center = position
    ? ([position.lat, position.lng] as [number, number])
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={21}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
      <MapMarker />
      <MapPolygon />
      <MapFlyTo />
    </MapContainer>
  );
}
