import Sidebar from "../components/Sidebar";
import MainMap from "../components/MainMap";
import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapControlSlot from "@/components/MapControlSlot";
import LayerSwitcher from "@/components/LayerSwitcher";
import CustomZoomControl from "@/components/CustomZoomControl";
import MeasureMenu from "@/components/MeasureMenu";
import { ButtonGroup } from "@/components/ButtonGroup";
import { LocateButton } from "@/components/LocateButton";
import MouseCoordinates from "@/components/MouseCoordinates";

export default function MapPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="relative flex h-screen w-screen">
      <div
        className={`z-[1000] bg-white shadow-md transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="relative flex-1">
        <MainMap>
          <MapControlSlot position="top-left">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRightClose className="text-gray-700 hover:text-gray-800" />
              ) : (
                <PanelRightOpen className="text-gray-700 hover:text-gray-800" />
              )}
            </Button>
          </MapControlSlot>
          <MapControlSlot position="bottom-left">
            <LayerSwitcher />
          </MapControlSlot>
          <MapControlSlot position="top-right">
            <CustomZoomControl />
            <ButtonGroup>
              <LocateButton />
            </ButtonGroup>
            <MeasureMenu />
          </MapControlSlot>
          <MapControlSlot position="bottom-right">
            <MouseCoordinates />
          </MapControlSlot>
        </MainMap>
      </div>
    </div>
  );
}
