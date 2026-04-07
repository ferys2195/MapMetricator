import GPXParser from "../UploadGPX";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { Map, MapPinPlus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "../ui/sidebar";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import L from "leaflet";
import { useState } from "react";
import { WaypointItem } from "@/features/waypoint";
import { utmToLatLng } from "@/lib/geoUtils";

const SidebarMap = () => {
  const { addMarker, markers } = useMarkerStore();
  const [utmInput, setUtmInput] = useState("");

  const parseUtmString = (utmString: string) => {
    const parts = utmString.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const zoneHemisphere = parts[0];
    const easting = parseFloat(parts[1]);
    const northing = parseFloat(parts[2]);

    if (isNaN(easting) || isNaN(northing)) return null;

    const zoneNumber = parseInt(zoneHemisphere.slice(0, -1));
    const hemisphere = (
      zoneHemisphere.slice(-1).toLowerCase() === "s" ? "south" : "north"
    ) as "north" | "south";

    return {
      easting,
      northing,
      zoneNumber,
      hemisphere,
      getAsString: utmString,
    };
  };

  const handleAddWaypoint = () => {
    const parsed = parseUtmString(utmInput);
    if (parsed) {
      const latLng = utmToLatLng(parsed);
      addMarker(new L.LatLng(latLng.lat, latLng.lng));
      setUtmInput("");
    } else {
      alert("Invalid UTM format. Use format like: 49S 707172 9751522");
    }
  };
  return (
    <Sidebar variant="sidebar" className="z-2000">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                  <Map className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">GPX Tool</span>
                  <span className="truncate text-xs">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Open GPX File</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <GPXParser />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Waypoints</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus /> Add Waypoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="z-500">
                    <DialogHeader>Add new waypoint</DialogHeader>
                    <Input
                      type="text"
                      placeholder="ex: 49S 707172 9751522"
                      value={utmInput}
                      onChange={(e) => setUtmInput(e.target.value)}
                      className="mb-2"
                    />
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddWaypoint}>
                        <MapPinPlus /> Add Waypoint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="space-y-0.5">
                {markers.map((marker, index) => (
                  <WaypointItem key={index} id={index} marker={marker} />
                ))}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="text-sm">
        <div className="text-muted-foreground px-2 py-4">
          <p>
            Made with <span className="text-red-500">❤</span> by Fery Irawan
          </p>
          <p>
            {" "}
            This project is open source, visit {""}
            <a
              href="https://github.com/ferys2195/gpx-tool"
              target="_blank"
              className="underline"
            >
              the repo.
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarMap;
