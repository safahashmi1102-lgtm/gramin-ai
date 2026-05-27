import { useState } from "react";
import { MapPin, X } from "lucide-react";

type CoordNavigateSheetProps = {
  open: boolean;
  onClose: () => void;
  onGo: (lat: number, lng: number) => void;
};

export function CoordNavigateSheet({ open, onClose, onGo }: CoordNavigateSheetProps) {
  const [lat, setLat] = useState("17.421000");
  const [lng, setLng] = useState("78.337000");

  if (!open) return null;

  const submit = () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    if (la < -90 || la > 90 || ln < -180 || ln > 180) return;
    onGo(la, ln);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div className="w-full max-w-[380px] rounded-2xl bg-card border border-border shadow-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Go to coordinates</h2>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter latitude and longitude (decimal degrees). Map will jump there — useful for revisiting a known point.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Latitude</span>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Longitude</span>
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-5 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-elevated"
        >
          Jump to location
        </button>
      </div>
    </div>
  );
}
