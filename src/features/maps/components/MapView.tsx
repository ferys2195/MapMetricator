import { MapContainer, useMapEvents } from "react-leaflet";
import MapFlyTo from "../../../components/MapFlyTo";
import MapPolygon from "../../../components/MapPolygon";
import { useGeolocationStore } from "@/stores/geolocationStore";
import { useEffect } from "react";
import MapInstanceSaver from "../../../components/MapInstanceSaver";
import MarkerList from "../../../components/MarkerList";
import { useMarkerStore } from "@/stores/useMarkerStore";

export function MapView({ children }: { children?: React.ReactNode }) {
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
        zoom={18}
        minZoom={5}
        maxZoom={25}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        {children}
        <ClickHandler />
        <MapInstanceSaver />
        <MarkerList />
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
      zoom={18}
      minZoom={5}
      maxZoom={25}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
      <ClickHandler />
      <MarkerList />
      <MapPolygon />
      <MapFlyTo />
    </MapContainer>
  );
}

function ClickHandler() {
  const { isAddingMarker, addMarker } = useMarkerStore();

  useMapEvents({
    click(e) {
      if (isAddingMarker) {
        addMarker(e.latlng);
        // add this if you want toggle off after 1 click:
        // useMarkerStore.getState().setAddingMarker(false);
      }
    },
  });

  return null;
}
