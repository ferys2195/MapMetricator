import {
  MapView,
  MapControlSlot,
  LayerSwitcher,
  CustomZoomControl,
  MouseCoordinates,
} from "@/features/maps";
import { MeasureMenu } from "@/features/measure";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SidebarMap from "@/components/navigation/SidebarMap";

export default function IndexPage() {
  return (
    <div className="relative flex h-screen w-screen">
      <div className="relative flex-1">
        <SidebarMap />
        <MapView>
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
        </MapView>
      </div>
    </div>
  );
}
