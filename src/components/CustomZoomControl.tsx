import { useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { ButtonGroup } from "./ButtonGroup";
import { Button } from "./ui/button";

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
    <ButtonGroup>
      <Button
        onClick={zoomIn}
        disabled={zoom >= maxZoom}
        variant={"ghost"}
        size={"icon"}
        className={`rounded-none ${zoom >= maxZoom && "cursor-not-allowed opacity-50"}`}
      >
        <Plus size={16} />
      </Button>
      <Button
        onClick={zoomOut}
        disabled={zoom <= minZoom}
        variant={"ghost"}
        size={"icon"}
        className={`rounded-none ${zoom <= minZoom && "cursor-not-allowed opacity-50"}`}
      >
        <Minus size={16} />
      </Button>
    </ButtonGroup>
  );
};

export default CustomZoomControl;
