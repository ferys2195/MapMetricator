import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Sidebar = () => {
  return (
    <div className="relative h-full space-y-4 border-r bg-white p-4 text-sm">
      <h2 className="text-lg font-semibold">Marker List</h2>

      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["kawasan-hutan", "marker"]}
      >
        <AccordionItem value="kawasan-hutan">
          <AccordionTrigger>File</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground ml-2 text-sm"></div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bidang-tanah">
          <AccordionTrigger>Bidang Tanah</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground ml-2 text-sm">
              [Kontrol Layer]
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="index-peta-dasar">
          <AccordionTrigger>Pengaturan Peta</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground ml-2 text-sm">
              [Kontrol Layer]
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hgu">
          <AccordionTrigger>Hak Guna Usaha</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground ml-2 text-sm">
              [Kontrol Layer]
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="marker" data-state="open">
          <AccordionTrigger>Marker List</AccordionTrigger>
          <AccordionContent>
            <div className="ml-2 p-2 text-sm">
              <ol className="list-decimal">
                <li>
                  <code>49 M 707172 9755789</code>
                </li>
                <li>
                  <code>49 M 707175 9755769</code>
                </li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
