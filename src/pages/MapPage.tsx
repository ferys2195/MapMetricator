import MainMap from "../components/MainMap";
import MapControlSlot from "@/components/MapControlSlot";
import LayerSwitcher from "@/components/LayerSwitcher";
import CustomZoomControl from "@/components/CustomZoomControl";
import MeasureMenu from "@/components/MeasureMenu";
import MouseCoordinates from "@/components/MouseCoordinates";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SidebarMap from "@/components/Sidebar";

export default function MapPage() {
  return (
    <div className="relative flex h-screen w-screen">
      <div className="relative flex-1">
        <SidebarMap />
        <MainMap>
          <MapControlSlot position="top-left">
            <SidebarTrigger />
          </MapControlSlot>
          <MapControlSlot position="top-right">
            <CustomZoomControl />
            <MeasureMenu />
          </MapControlSlot>
          <MapControlSlot position="bottom-right">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-center">
              <LayerSwitcher />
              <MouseCoordinates />
            </div>
          </MapControlSlot>
        </MainMap>
      </div>
    </div>
  );
}
