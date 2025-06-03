import { TileLayer } from "react-leaflet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const baseLayers: Record<string, string> = {
  OpenStreetMap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "Esri World Imagery":
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const LayerSwitcher = () => {
  const [currentLayer, setCurrentLayer] = useState("OpenStreetMap");

  return (
    <>
      {/* Tabs UI di pojok kanan bawah */}
      {/*  className="absolute bottom-2.5 left-2.5 z-[1000]" */}
      <div>
        <Tabs
          defaultValue={currentLayer}
          onValueChange={setCurrentLayer}
          className="w-full max-w-xs"
        >
          <TabsList className="bg-background h-auto gap-1">
            {Object.keys(baseLayers).map((layerName) => (
              <TabsTrigger
                key={layerName}
                value={layerName}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="text-[13px]">{layerName}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* TileLayer aktif */}
      <TileLayer
        key={currentLayer}
        maxNativeZoom={25}
        url={baseLayers[currentLayer]}
      />
    </>
  );
};

export default LayerSwitcher;
