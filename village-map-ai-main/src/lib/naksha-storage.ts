import type { HouseRecord, NakshaPersistedState, NumberingMode } from "./naksha-types";
import { defaultSurvey, STORAGE_KEY } from "./naksha-types";

const defaultState = (): NakshaPersistedState => ({
  markers: [],
  numberingMode: "sequential",
  seqCounter: 0,
  denseSettlement: true,
  followGps: true,
  mapLayer: "street",
  manualOrderUids: [],
});

function migrateMarker(raw: Record<string, unknown>): HouseRecord {
  const survey = raw.survey as HouseRecord["survey"] | undefined;
  return {
    uid: String(raw.uid),
    houseNumber: String(raw.houseNumber ?? "H-000"),
    seq: Number(raw.seq) || 0,
    lat: Number(raw.lat),
    lng: Number(raw.lng),
    familyHeadName: String(raw.familyHeadName ?? ""),
    notes: String(raw.notes ?? ""),
    floorNumber: String(raw.floorNumber ?? ""),
    flatNumber: String(raw.flatNumber ?? ""),
    placementSource: raw.placementSource === "manual" ? "manual" : "gps",
    status: raw.status === "done" || raw.status === "ai" ? raw.status : "pending",
    survey: survey
      ? { ...defaultSurvey(), ...survey }
      : defaultSurvey(),
    photoId: raw.photoId != null ? String(raw.photoId) : null,
    gpsAccuracy: raw.gpsAccuracy != null ? Number(raw.gpsAccuracy) : null,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function loadNakshaState(): NakshaPersistedState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const mode = parsed.numberingMode as NumberingMode;
    const numberingMode: NumberingMode =
      mode === "snake" || mode === "manual" ? mode : "sequential";
    const markers = Array.isArray(parsed.markers)
      ? (parsed.markers as Record<string, unknown>[]).map(migrateMarker)
      : [];
    return {
      markers,
      numberingMode,
      seqCounter: typeof parsed.seqCounter === "number" ? parsed.seqCounter : markers.length,
      denseSettlement: parsed.denseSettlement !== false,
      followGps: parsed.followGps !== false,
      mapLayer: parsed.mapLayer === "satellite" ? "satellite" : "street",
      manualOrderUids: Array.isArray(parsed.manualOrderUids)
        ? (parsed.manualOrderUids as string[])
        : markers.map((m) => m.uid),
    };
  } catch {
    return defaultState();
  }
}

export function saveNakshaState(state: NakshaPersistedState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function numberingModeLabel(mode: NumberingMode): string {
  if (mode === "snake") return "Snake pattern";
  if (mode === "manual") return "Manual order";
  return "Sequential";
}
