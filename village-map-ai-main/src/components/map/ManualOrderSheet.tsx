import { ChevronDown, ChevronUp, ListOrdered, X } from "lucide-react";
import { useNaksha } from "@/context/NakshaContext";

type ManualOrderSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function ManualOrderSheet({ open, onClose }: ManualOrderSheetProps) {
  const { markers, manualOrderUids, moveManualOrder, setNumberingMode } = useNaksha();

  if (!open) return null;

  const ordered = manualOrderUids
    .map((uid) => markers.find((m) => m.uid === uid))
    .filter(Boolean) as typeof markers;

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-[380px] max-h-[70vh] rounded-2xl bg-card border border-border shadow-elevated flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">Manual numbering</h2>
              <p className="text-[10px] text-muted-foreground">Snake / lane order for apartments</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-1 flex-1">
          {ordered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Add houses first, then set order.</p>
          ) : (
            ordered.map((m, i) => (
              <div
                key={m.uid}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/60"
              >
                <span className="text-xs font-mono font-bold text-primary w-12">{m.houseNumber}</span>
                <span className="flex-1 text-sm font-medium truncate">{m.familyHeadName}</span>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveManualOrder(m.uid, "up")}
                    className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === ordered.length - 1}
                    onClick={() => moveManualOrder(m.uid, "down")}
                    className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setNumberingMode("manual");
              onClose();
            }}
            className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Apply manual numbering
          </button>
        </div>
      </div>
    </div>
  );
}
