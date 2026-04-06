import { MapContainer, useMapEvents } from "react-leaflet";
import MapFlyTo from "../../../components/MapFlyTo";
import { useGeolocationStore } from "@/stores/geolocationStore";
import { useEffect } from "react";
// import MapInstanceSaver from "../../../components/MapInstanceSaver";
import MarkerList from "../../../components/MarkerList";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { AreaMeasureView } from "@/features/measure";
import DrawPolylineLayer from "@/components/DrawPolylineLayer";
import { useMapModeStore } from "@/stores/useMapModeStore";

const defaultCenter: [number, number] = [-6.193096, 106.823504];

export function MapView({ children }: { children?: React.ReactNode }) {
  const { position, isLoading, getCurrentPosition } = useGeolocationStore();

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  if (isLoading) {
    return <div>Loading your location...</div>;
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
      doubleClickZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
      <ClickHandler />
      {/* <MapInstanceSaver /> */}
      <DrawPolylineLayer />
      <MarkerList />
      <AreaMeasureView />
      <MapFlyTo />
    </MapContainer>
  );
}

function ClickHandler() {
  const { addMarker } = useMarkerStore();
  const { mode } = useMapModeStore();

  useMapEvents({
    click(e) {
      if (mode !== "marker") return;

      addMarker(e.latlng);
    },
  });

  return null;
}
