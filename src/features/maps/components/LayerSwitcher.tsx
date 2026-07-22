import { TileLayer } from "react-leaflet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

type LayerConfig = {
  url: string;
  maxNativeZoom: number;
};

const baseLayers: Record<string, LayerConfig> = {
  OpenStreetMap: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxNativeZoom: 19,
  },
  "Esri World Imagery": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxNativeZoom: 17,
  },
};

const LayerSwitcher = () => {
  const [currentLayer, setCurrentLayer] = useState("OpenStreetMap");

  return (
    <>
      {/* Tabs UI di pojok kanan bawah */}
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
        maxNativeZoom={baseLayers[currentLayer].maxNativeZoom}
        maxZoom={25}
        url={baseLayers[currentLayer].url}
      />
    </>
  );
};

export default LayerSwitcher;
