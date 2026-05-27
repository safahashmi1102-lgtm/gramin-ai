import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Droplet,
  GraduationCap,
  Home,
  Trash2,
  Wheat,
  X,
  Zap,
} from "lucide-react";
import { useNaksha } from "@/context/NakshaContext";
import { compressImageFile, loadHousePhoto } from "@/lib/naksha-photos";
import type { HouseFormData, MarkerStatus, SurveyAnswers } from "@/lib/naksha-types";
import { defaultSurvey } from "@/lib/naksha-types";

export function MarkerSheet() {
  const {
    sheetOpen,
    draft,
    closeSheet,
    saveMarker,
    deleteMarker,
    getMarker,
    previewHouseNumber,
  } = useNaksha();

  const existing = draft?.uid ? getMarker(draft.uid) : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [familyHeadName, setFamilyHeadName] = useState("");
  const [notes, setNotes] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [status, setStatus] = useState<MarkerStatus>("pending");
  const [survey, setSurvey] = useState<SurveyAnswers>(defaultSurvey());
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen || !draft) return;
    setFamilyHeadName(existing?.familyHeadName ?? "");
    setNotes(existing?.notes ?? "");
    setFloorNumber(existing?.floorNumber ?? "");
    setFlatNumber(existing?.flatNumber ?? "");
    setStatus(existing?.status ?? "pending");
    setSurvey(existing?.survey ? { ...defaultSurvey(), ...existing.survey } : defaultSurvey());
    setPhotoId(existing?.photoId ?? null);
    if (existing?.photoId) {
      void loadHousePhoto(existing.photoId).then(setPhotoPreview);
    } else {
      setPhotoPreview(null);
    }
  }, [sheetOpen, draft, existing]);

  if (!sheetOpen || !draft) return null;

  const houseNumber = existing?.houseNumber ?? previewHouseNumber(draft.lat, draft.lng);
  const isEdit = Boolean(draft.uid);
  const accuracy =
    draft.gpsAccuracy != null ? `±${draft.gpsAccuracy.toFixed(1)}m GPS` : "GPS accuracy unknown";

  const formData = (): HouseFormData => ({
    familyHeadName,
    notes,
    floorNumber,
    flatNumber,
    status,
    survey,
    photoId: existing?.photoId ?? photoId,
    photoDataUrl: photoPreview,
  });

  const onPhotoPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setPhotoPreview(dataUrl);
    } catch {
      alert("Could not load photo. Try a smaller image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-foreground/40 p-2 sm:items-center sm:p-4">
      <div
        className="w-full max-w-[380px] max-h-[92vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-elevated p-5"
        role="dialog"
        aria-labelledby="marker-sheet-title"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                {isEdit ? "House confirmed" : "Confirm house here"}
              </p>
              <h2 id="marker-sheet-title" className="text-xl font-bold text-foreground">
                {houseNumber}
              </h2>
            </div>
          </div>
          <button type="button" onClick={closeSheet} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-1 font-mono">
          {draft.lat.toFixed(6)}°, {draft.lng.toFixed(6)}° · {accuracy}
        </p>
        <p className="text-[10px] text-muted-foreground mb-4">
          Enumerator confirms this structure exists — not auto-detected by maps.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Family head name
            </span>
            <input
              value={familyHeadName}
              onChange={(e) => setFamilyHeadName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="mt-1.5 w-full rounded-xl bg-background border border-border px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Floor (optional)
              </span>
              <input
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 2"
                className="mt-1.5 w-full rounded-xl bg-background border border-border px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Flat (optional)
              </span>
              <input
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. A-203"
                className="mt-1.5 w-full rounded-xl bg-background border border-border px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Floor, wing, lane, access…"
              rows={2}
              className="mt-1.5 w-full rounded-xl bg-background border border-border px-3.5 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Survey answers
            </span>
            <div className="mt-2 space-y-3">
              <label className="block">
                <span className="text-[10px] text-muted-foreground">Family members</span>
                <input
                  value={survey.familyMembers}
                  onChange={(e) => setSurvey((s) => ({ ...s, familyMembers: e.target.value }))}
                  inputMode="numeric"
                  placeholder="6"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>
              <div>
                <span className="text-[10px] text-muted-foreground">House type</span>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {["Kutcha", "Semi-pucca", "Pucca"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSurvey((s) => ({ ...s, houseType: t }))}
                      className={`py-2 rounded-lg text-[10px] font-semibold border ${
                        survey.houseType === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ["tapWater", "Tap water", Droplet],
                    ["electricity", "Electricity", Zap],
                    ["farmLand", "Farm land", Wheat],
                    ["schoolAccess", "School", GraduationCap],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setSurvey((s) => ({ ...s, [key]: !s[key] }))
                    }
                    className={`py-2 px-2 rounded-lg text-[10px] font-medium border flex items-center gap-1.5 ${
                      survey[key]
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              House photo
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void onPhotoPick(e.target.files?.[0])}
            />
            <div className="mt-2 flex gap-2">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="House"
                  className="h-20 w-20 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-secondary border border-dashed border-border" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground min-h-[80px]"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Take / upload photo</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Status
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["pending", "Pending", "bg-warning"],
                  ["done", "Surveyed", "bg-success"],
                  ["ai", "Flagged", "bg-accent"],
                ] as const
              ).map(([value, label, dot]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                    status === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pb-safe">
          {isEdit ? (
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm(`Delete ${houseNumber}? This cannot be undone.`);
                if (ok) deleteMarker(draft.uid!);
              }}
              className="h-12 px-4 rounded-2xl border border-destructive/40 text-destructive flex items-center justify-center gap-1.5 text-sm font-semibold"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
          <button type="button" onClick={closeSheet} className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveMarker(formData())}
            className="flex-[1.5] h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-elevated"
          >
            {isEdit ? "Save house" : "Confirm house"}
          </button>
        </div>
      </div>
    </div>
  );
}
