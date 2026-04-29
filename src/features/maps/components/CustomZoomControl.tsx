import { useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const CustomZoomControl = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  const minZoom = map.getMinZoom();
  const maxZoom = map.getMaxZoom();

  useEffect(() => {
    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on("zoomend", handleZoom);

    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map]);

  const zoomIn = () => {
    if (zoom < maxZoom) {
      map.zoomIn();
    }
  };

  const zoomOut = () => {
    if (zoom > minZoom) {
      map.zoomOut();
    }
  };

  return (
    <ButtonGroup
      orientation="vertical"
      aria-label="Zoom controls"
      className="h-fit"
    >
      <Button
        onClick={zoomIn}
        disabled={zoom >= maxZoom}
        variant={"secondary"}
        size={"icon"}
        className={`${zoom >= maxZoom && "cursor-not-allowed opacity-50"}`}
      >
        <Plus size={16} />
      </Button>
      <Button
        onClick={zoomOut}
        disabled={zoom <= minZoom}
        size={"icon"}
        variant={"secondary"}
        className={`${zoom <= minZoom && "cursor-not-allowed opacity-50"}`}
      >
        <Minus size={16} />
      </Button>
    </ButtonGroup>
  );
};

export default CustomZoomControl;
