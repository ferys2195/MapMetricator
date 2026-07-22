import {
  MapView,
  MapControlSlot,
  LayerSwitcher,
  CustomZoomControl,
  MouseCoordinates,
} from "@/features/maps";
import { GeomanSetup } from "@/features/drawing";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import SidebarMap from "@/components/navigation/SidebarMap";

export default function IndexPage() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <SidebarMap />
      <SidebarInset className="relative flex-1 flex flex-col h-full overflow-hidden">
        <div className="relative flex-1">
          <MapView>
            <GeomanSetup />
            <MapControlSlot position="top-left">
              <SidebarTrigger />
            </MapControlSlot>
            <MapControlSlot position="top-right">
              <CustomZoomControl />
            </MapControlSlot>
            <MapControlSlot position="bottom-right">
              <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-center">
                <LayerSwitcher />
                <MouseCoordinates />
              </div>
            </MapControlSlot>
          </MapView>
        </div>
      </SidebarInset>
    </div>
  );
}
