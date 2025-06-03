import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GPXParser from "./UploadGPX";
import { useMarkerStore } from "@/stores/useMarkerStore";
import { latLngToUtm } from "@/lib/geoUtils";

const Sidebar = () => {
  const { markers } = useMarkerStore();
  return (
    <div className="relative h-full space-y-4 border-r bg-white p-4 text-sm">
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
            <ol className="list-decimal">
              {markers.map((marker) => (
                <li>
                  <code>{latLngToUtm(marker).getAsString}</code>
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
