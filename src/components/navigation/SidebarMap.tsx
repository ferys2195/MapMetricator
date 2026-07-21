import GPXParser from "../UploadGPX";
import { useGeoStore } from "@/stores/useGeoStore";
import { Map, MapPinPlus, Plus, Search } from "lucide-react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const SidebarMap = () => {
  const { waypoints, tracks, routes, addWaypoint } = useGeoStore();
  const [utmInput, setUtmInput] = useState("");
  const [indexFilter, setIndexFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");

  const markersToWaypoint = waypoints.map((wpt, index) => ({
    id: index,
    marker: new L.LatLng(wpt.lat, wpt.lon),
  }));

  const filteredMarkers = markersToWaypoint.filter((_, index) => {
    const query = indexFilter.trim();
    if (!query) return true;
    const displayId = String(index + 1).padStart(3, "0");
    return displayId.includes(query);
  });

  const filteredRoutes = routes.filter((route) => {
    const query = routeFilter.toLowerCase().trim();
    if (!query) return true;
    return route.name?.toLowerCase().includes(query) || false;
  });

  const filteredTracks = tracks.filter((track) => {
    const query = trackFilter.toLowerCase().trim();
    if (!query) return true;
    return track.name?.toLowerCase().includes(query) || false;
  });

  const parseUtmString = (utmString: string) => {
    const parts = utmString.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const zoneHemisphere = parts[0];
    const easting = parseFloat(parts[1]);
    const northing = parseFloat(parts[2]);

    if (isNaN(easting) || isNaN(northing)) return null;

    const zoneNumber = parseInt(zoneHemisphere.slice(0, -1));
    const band = zoneHemisphere.slice(-1).toUpperCase();
    
    let hemisphere: "north" | "south" = "north";
    if (band === 'S') {
      hemisphere = "south";
    } else if (band === 'N') {
      hemisphere = "north";
    } else {
      // Garmin/MGRS Latitude Bands: C to M are South, N to X are North
      if (band >= 'C' && band <= 'M') {
        hemisphere = "south";
      } else {
        hemisphere = "north";
      }
    }

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
      addWaypoint({ lat: latLng.lat, lon: latLng.lng, name: `Manual Wpt ${waypoints.length + 1}` });
      setUtmInput("");
    } else {
      alert("Invalid UTM format. Use format like: 49S 707172 9751522");
    }
  };

  return (
    <Sidebar variant="inset" className="z-2000">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
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
        
        <div className="px-2 mt-4 flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="waypoint" className="w-full flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
              <TabsTrigger value="waypoint">Waypoint</TabsTrigger>
              <TabsTrigger value="route">Route</TabsTrigger>
              <TabsTrigger value="track">Track</TabsTrigger>
            </TabsList>
            
            <TabsContent value="waypoint" className="flex-1 overflow-hidden outline-none">
              <SidebarGroup className="p-0 h-full flex flex-col">
                <SidebarMenu className="space-y-2.5 h-full flex flex-col">
                  <SidebarMenuItem className="shrink-0">
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
                  {markersToWaypoint.length > 0 && (
                    <SidebarMenuItem className="shrink-0">
                      <InputGroup className="max-w-xs">
                        <InputGroupInput
                          placeholder="Filter markers by index..."
                          value={indexFilter}
                          onChange={(e) => setIndexFilter(e.target.value)}
                        />
                        <InputGroupAddon>
                          <Search />
                        </InputGroupAddon>
                      </InputGroup>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem className="flex-1 overflow-hidden">
                    <div className="space-y-0.5 h-full overflow-y-auto pr-1 pb-2">
                      {filteredMarkers.map(({ id, marker }) => (
                        <WaypointItem key={id} id={id} marker={marker} />
                      ))}
                    </div>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </TabsContent>
            
            <TabsContent value="route" className="flex-1 overflow-hidden outline-none">
              <SidebarGroup className="p-0 h-full flex flex-col">
                {routes.length > 0 && (
                  <div className="shrink-0 mb-2.5">
                    <InputGroup className="max-w-xs">
                      <InputGroupInput
                        placeholder="Filter routes by name..."
                        value={routeFilter}
                        onChange={(e) => setRouteFilter(e.target.value)}
                      />
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                )}
                <div className="space-y-2 h-full overflow-y-auto pr-1 pb-2 flex-1">
                  {routes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No routes available</p>
                  ) : filteredRoutes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No routes match your filter</p>
                  ) : (
                    filteredRoutes.map((route, i) => (
                      <div key={route.id || i} className="rounded-md border px-2.5 py-2 text-sm">
                        <div className="font-medium">{route.name}</div>
                        <div className="text-xs text-muted-foreground">{route.points.length} points</div>
                      </div>
                    ))
                  )}
                </div>
              </SidebarGroup>
            </TabsContent>
            
            <TabsContent value="track" className="flex-1 overflow-hidden outline-none">
              <SidebarGroup className="p-0 h-full flex flex-col">
                {tracks.length > 0 && (
                  <div className="shrink-0 mb-2.5">
                    <InputGroup className="max-w-xs">
                      <InputGroupInput
                        placeholder="Filter tracks by name..."
                        value={trackFilter}
                        onChange={(e) => setTrackFilter(e.target.value)}
                      />
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                )}
                <div className="space-y-2 h-full overflow-y-auto pr-1 pb-2 flex-1">
                  {tracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tracks available</p>
                  ) : filteredTracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tracks match your filter</p>
                  ) : (
                    filteredTracks.map((track, i) => (
                      <div key={track.id || i} className="rounded-md border px-2.5 py-2 text-sm">
                        <div className="font-medium">{track.name}</div>
                        <div className="text-xs text-muted-foreground">{track.segments.length} segments</div>
                      </div>
                    ))
                  )}
                </div>
              </SidebarGroup>
            </TabsContent>
          </Tabs>
        </div>
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
