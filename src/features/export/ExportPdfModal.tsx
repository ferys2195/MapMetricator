import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Loader2 } from "lucide-react";
import type { Route, Track } from "@/lib/gpxParser";
import {
  renderUTMMapToCanvas,
  exportRoutePDF,
  exportTrackPDF,
  type BaseMapType,
} from "@/lib/pdfExporter";

export type ExportPdfTarget =
  | { type: "route"; item: Route }
  | { type: "track"; item: Track }
  | null;

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ExportPdfTarget;
}

export const ExportPdfModal = ({
  isOpen,
  onClose,
  target,
}: ExportPdfModalProps) => {
  const [title, setTitle] = useState("");
  const [baseMap, setBaseMap] = useState<BaseMapType>("global");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (target) {
      const initialTitle = target.item.name || (target.type === "route" ? "Route Map" : "Track Map");
      setTitle(initialTitle);
    }
  }, [target]);

  useEffect(() => {
    if (!target || !isOpen) {
      setPreviewUrl(null);
      return;
    }

    let isMounted = true;
    setIsRendering(true);

    let rawSegments: [number, number][][] = [];

    if (target.type === "route") {
      rawSegments = [target.item.points];
    } else if (target.type === "track") {
      rawSegments = target.item.segments;
    }

    renderUTMMapToCanvas(rawSegments, title || "Map Export", baseMap)
      .then((canvas) => {
        if (isMounted) {
          setPreviewUrl(canvas.toDataURL("image/png"));
          setIsRendering(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsRendering(false);
      });

    return () => {
      isMounted = false;
    };
  }, [target, title, baseMap, isOpen]);

  if (!target) return null;

  const handleDownload = async () => {
    setIsRendering(true);
    if (target.type === "route") {
      await exportRoutePDF(target.item, title, baseMap);
    } else {
      await exportTrackPDF(target.item, title, baseMap);
    }
    setIsRendering(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col z-2500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-emerald-600" />
            <span>Export Map PDF (UTM WGS 84 Layout)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Judul Peta / Subtitle
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul peta..."
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Base Map Peta PDF
            </label>
            <Tabs
              value={baseMap}
              onValueChange={(val) => setBaseMap(val as BaseMapType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="global" className="text-xs">
                  Global Map
                </TabsTrigger>
                <TabsTrigger value="esri" className="text-xs">
                  Esri Imagery
                </TabsTrigger>
                <TabsTrigger value="osm" className="text-xs">
                  OpenStreetMap
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/50 p-2.5 rounded-lg border">
            <div>
              <span className="text-muted-foreground block">Proyeksi & Grid:</span>
              <span className="font-semibold text-foreground">UTM WGS 84 (Unified Proj)</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Ukuran Kertas:</span>
              <span className="font-semibold text-foreground">A4 Portrait</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Pratinjau Layout Peta (Preview)
            </label>
            <div className="relative border rounded-lg bg-zinc-900/5 p-2 flex justify-center items-center min-h-[320px]">
              {isRendering ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Mengunduh tile peta & membuat layout...</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="PDF Preview"
                  className="max-h-[360px] w-auto shadow-md rounded border bg-white object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Pratinjau tidak tersedia</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" onClick={onClose} size="sm" disabled={isRendering}>
            Batal
          </Button>
          <Button
            onClick={handleDownload}
            size="sm"
            disabled={isRendering}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {isRendering ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            <span>Download PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
