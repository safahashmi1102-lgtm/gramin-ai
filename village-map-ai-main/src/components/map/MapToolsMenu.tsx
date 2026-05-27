import { useEffect, useRef } from "react";
import {
  Building2,
  Camera,
  Crosshair,
  FileDown,
  FileUp,
  Grip,
  Layers,
  ListOrdered,
  MapPin,
  MountainSnow,
  RotateCcw,
  Spline,
} from "lucide-react";
import { numberingModeLabel } from "@/lib/naksha-storage";
import type { MapLayer, NumberingMode } from "@/lib/naksha-types";

type MapToolsMenuProps = {
  open: boolean;
  onClose: () => void;
  numberingMode: NumberingMode;
  denseSettlement: boolean;
  followGps: boolean;
  mapLayer: MapLayer;
  onNumberingMode: (mode: NumberingMode) => void;
  onDenseSettlement: (v: boolean) => void;
  onFollowGps: (v: boolean) => void;
  onMapLayer: (v: MapLayer) => void;
  onManualOrder: () => void;
  onNavigate: () => void;
  onUndo: () => void;
  onExport: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: () => void;
  canUndo: boolean;
  exporting: boolean;
};

export function MapToolsMenu({
  open,
  onClose,
  numberingMode,
  denseSettlement,
  followGps,
  mapLayer,
  onNumberingMode,
  onDenseSettlement,
  onFollowGps,
  onMapLayer,
  onManualOrder,
  onNavigate,
  onUndo,
  onExport,
  onExportJson,
  onExportCsv,
  onImportJson,
  canUndo,
  exporting,
}: MapToolsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute top-12 right-3 z-[500] w-56 rounded-2xl bg-background/98 backdrop-blur border border-border/60 shadow-elevated p-2 text-left max-h-[320px] overflow-y-auto"
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
        Field tools
      </p>
      <button
        type="button"
        onClick={() => onFollowGps(!followGps)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold ${
          followGps ? "bg-primary/15 text-primary" : "hover:bg-secondary"
        }`}
      >
        <Crosshair className="h-3.5 w-3.5" />
        Follow GPS {followGps ? "on" : "off"}
      </button>
      <button
        type="button"
        onClick={() => onDenseSettlement(!denseSettlement)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold mt-1 ${
          denseSettlement ? "bg-primary/15 text-primary" : "hover:bg-secondary"
        }`}
      >
        <Building2 className="h-3.5 w-3.5" />
        Dense settlement {denseSettlement ? "on" : "off"}
      </button>
      <button
        type="button"
        onClick={() => onMapLayer(mapLayer === "street" ? "satellite" : "street")}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold mt-1 ${
          mapLayer === "satellite" ? "bg-primary/15 text-primary" : "hover:bg-secondary"
        }`}
      >
        <MountainSnow className="h-3.5 w-3.5" />
        Satellite {mapLayer === "satellite" ? "on" : "off"}
      </button>
      <button
        type="button"
        onClick={() => {
          onNavigate();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold mt-1 hover:bg-secondary"
      >
        <MapPin className="h-3.5 w-3.5" />
        Go to coordinates
      </button>

      <div className="h-px bg-border my-2" />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
        Numbering
      </p>
      {(
        [
          ["sequential", "Sequential", ListOrdered],
          ["snake", "Snake (auto)", Spline],
          ["manual", "Manual order", Grip],
        ] as const
      ).map(([mode, label, Icon]) => (
        <button
          key={mode}
          type="button"
          onClick={() => {
            onNumberingMode(mode);
            if (mode === "manual") onManualOrder();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold mt-1 ${
            numberingMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
      <p className="text-[9px] text-muted-foreground px-2 mt-1">
        Active: {numberingModeLabel(numberingMode)}
      </p>

      <div className="h-px bg-border my-2" />
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => {
          onUndo();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold hover:bg-secondary disabled:opacity-40"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Undo (Ctrl+Z)
      </button>
      <button
        type="button"
        disabled={exporting}
        onClick={() => {
          onExport();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold hover:bg-secondary disabled:opacity-40 mt-1"
      >
        <Camera className="h-3.5 w-3.5" />
        {exporting ? "Exporting…" : "Export map PNG"}
      </button>
      <button
        type="button"
        onClick={() => {
          onExportJson();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold hover:bg-secondary mt-1"
      >
        <FileDown className="h-3.5 w-3.5" />
        Export JSON
      </button>
      <button
        type="button"
        onClick={() => {
          onExportCsv();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold hover:bg-secondary mt-1"
      >
        <FileDown className="h-3.5 w-3.5" />
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => {
          onImportJson();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold hover:bg-secondary mt-1"
      >
        <FileUp className="h-3.5 w-3.5" />
        Import JSON
      </button>
    </div>
  );
}
