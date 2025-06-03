import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GPXParser from "./UploadGPX";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { latLngToUtm } from "@/lib/geoUtils";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

const Sidebar = () => {
  const { removeMarker, markers } = useMarkerStore();
  return (
    <div className="relative h-full space-y-4 overflow-y-auto border-r bg-white p-4 text-sm">
      <h2 className="text-lg font-semibold">Marker List</h2>

      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["lapisan", "file", "marker"]}
      >
        <AccordionItem value="lapisan">
          <AccordionTrigger>Lapisan Peta</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground ml-2 text-sm">
              [Kontrol Layer]
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="file">
          <AccordionTrigger>File</AccordionTrigger>
          <AccordionContent>
            <div className="mb-2">Upload GPX File</div>
            <GPXParser />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="marker" data-state="open">
          <AccordionTrigger>Marker List</AccordionTrigger>
          <AccordionContent>
            <ul>
              {markers.map((marker, index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <code>
                      {String(++index).padStart(3, "0")}{" "}
                      {latLngToUtm(marker).getAsString}
                    </code>
                    <Button
                      variant={"ghost"}
                      size={"icon"}
                      onClick={() => removeMarker(marker)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
