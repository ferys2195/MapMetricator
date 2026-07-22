import { useState, useEffect } from "react";
import { useGeoStore } from "@/stores/useGeoStore";
import { utmToLatLng } from "@/lib/geoUtils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPinPlus } from "lucide-react";

export const AddWaypointDialog = () => {
  const { waypoints, addWaypoint, isWaypointDialogOpen, closeWaypointDialog, waypointDialogUtm, openWaypointDialog } = useGeoStore();
  const [utmInput, setUtmInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (isWaypointDialogOpen) {
      setUtmInput(waypointDialogUtm);
      setNameInput("");
    }
  }, [isWaypointDialogOpen, waypointDialogUtm]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openWaypointDialog();
    } else {
      closeWaypointDialog();
    }
  };

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
      const wptName = nameInput.trim() || `Manual Wpt ${waypoints.length + 1}`;
      addWaypoint({ lat: latLng.lat, lon: latLng.lng, name: wptName });
      setUtmInput("");
      setNameInput("");
      closeWaypointDialog(); // Close dialog on success
    } else {
      alert("Invalid UTM format. Use format like: 49S 707172 9751522");
    }
  };

  return (
    <Dialog open={isWaypointDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[500]">
        <DialogHeader>Add new waypoint</DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="wpt-name" className="text-sm font-medium leading-none">Name (optional)</label>
            <Input
              id="wpt-name"
              type="text"
              placeholder={`ex: Manual Wpt ${waypoints.length + 1}`}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="wpt-utm" className="text-sm font-medium leading-none">UTM Position</label>
            <Input
              id="wpt-utm"
              type="text"
              placeholder="ex: 49S 707172 9751522"
              value={utmInput}
              onChange={(e) => setUtmInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddWaypoint}>
            <MapPinPlus className="mr-2 h-4 w-4" /> Add Waypoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
