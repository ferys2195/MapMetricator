import GPXParser from "../UploadGPX";
import { useGeoStore } from "@/stores/useGeoStore";
import { Map, Search, Download, Trash2, FileText } from "lucide-react";
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
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import L from "leaflet";
import { useState } from "react";
import { WaypointItem, AddWaypointDialog } from "@/features/waypoint";
import { ExportPdfModal, type ExportPdfTarget } from "@/features/export";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  exportRouteGPX,
  exportTrackGPX,
  exportGlobalGPX,
} from "@/lib/gpxExporter";

const SidebarMap = () => {
  const {
    waypoints,
    tracks,
    routes,
    removeRoute,
    removeTrack,
  } = useGeoStore();

  const [indexFilter, setIndexFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [exportPdfTarget, setExportPdfTarget] = useState<ExportPdfTarget>(null);

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

  const hasAnyData =
    waypoints.length > 0 ||
    routes.length > 0 ||
    tracks.length > 0;

  const handleGlobalExport = () => {
    exportGlobalGPX({
      waypoints,
      routes,
      tracks,
    });
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
                  <span className="truncate text-xs">v1.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Map Actions</SidebarGroupLabel>
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <GPXParser />
              </SidebarMenuButton>
            </SidebarMenuItem>
            {hasAnyData && (
              <SidebarMenuItem>
                <Button
                  onClick={handleGlobalExport}
                  className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  size="sm"
                >
                  <Download size={14} />
                  <span>Export Global GPX</span>
                </Button>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <div className="px-2 mt-2 flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="waypoint" className="w-full flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-3 mb-3 shrink-0 text-xs">
              <TabsTrigger value="waypoint">Waypoint ({waypoints.length})</TabsTrigger>
              <TabsTrigger value="route">Route ({routes.length})</TabsTrigger>
              <TabsTrigger value="track">Track ({tracks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="waypoint" className="flex-1 overflow-hidden outline-none">
              <SidebarGroup className="p-0 h-full flex flex-col">
                <SidebarMenu className="space-y-2.5 h-full flex flex-col">
                  {markersToWaypoint.length > 0 && (
                    <SidebarMenuItem className="shrink-0">
                      <InputGroup className="max-w-xs">
                        <InputGroupInput
                          placeholder="Filter markers..."
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
                    <div className="space-y-1.5 h-full overflow-y-auto pr-1 pb-2">
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
                      <div
                        key={route.id || i}
                        className="group flex items-center justify-between rounded-md border px-2.5 py-2 text-xs hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium truncate">{route.name}</div>
                          <div className="text-muted-foreground text-[11px]">
                            {route.points.length} points
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => exportRouteGPX(route)}
                            title="Export GPX"
                            className="h-7 w-7 p-0"
                          >
                            <Download size={12} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setExportPdfTarget({ type: "route", item: route })}
                            title="Export PDF (UTM WGS 84)"
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <FileText size={12} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => removeRoute(route.id)}
                            title="Hapus Route"
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
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
                      <div
                        key={track.id || i}
                        className="group flex items-center justify-between rounded-md border px-2.5 py-2 text-xs hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium truncate">{track.name}</div>
                          <div className="text-muted-foreground text-[11px]">
                            {track.segments.length} segment(s)
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => exportTrackGPX(track)}
                            title="Export GPX"
                            className="h-7 w-7 p-0"
                          >
                            <Download size={12} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setExportPdfTarget({ type: "track", item: track })}
                            title="Export PDF (UTM WGS 84)"
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <FileText size={12} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => removeTrack(track.id)}
                            title="Hapus Track"
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
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
      <AddWaypointDialog />
      <ExportPdfModal
        isOpen={!!exportPdfTarget}
        onClose={() => setExportPdfTarget(null)}
        target={exportPdfTarget}
      />
    </Sidebar>
  );
};

export default SidebarMap;
