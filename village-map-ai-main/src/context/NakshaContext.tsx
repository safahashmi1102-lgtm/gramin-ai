import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  assignNumberForNew,
  previewNextHouseNumber,
  renumberAll,
} from "@/lib/naksha-numbering";
import { deleteHousePhoto, saveHousePhoto } from "@/lib/naksha-photos";
import { loadNakshaState, saveNakshaState } from "@/lib/naksha-storage";
import type {
  HistoryAction,
  HouseFormData,
  HouseRecord,
  MapLayer,
  MarkerStatus,
  NumberingMode,
} from "@/lib/naksha-types";
import { defaultSurvey } from "@/lib/naksha-types";

type MarkerDraft = {
  lat: number;
  lng: number;
  uid?: string;
  gpsAccuracy: number | null;
  placementSource: "gps" | "manual";
};

export type TrailCoordinate = {
  lat: number;
  lng: number;
  timestamp: number;
};

type NakshaContextValue = {
  markers: HouseRecord[];
  numberingMode: NumberingMode;
  highlightedUids: string[];
  denseSettlement: boolean;
  followGps: boolean;
  syncStatus: "online" | "offline";
  isSaving: boolean;
  undoDeleteAvailable: boolean;
  mapLayer: MapLayer;
  manualOrderUids: string[];
  selectedUid: string | null;
  sheetOpen: boolean;
  draft: MarkerDraft | null;
  canUndo: boolean;
  hydrated: boolean;
  trailCoordinates: TrailCoordinate[];
  trailVisible: boolean;
  setSelectedUid: (uid: string | null) => void;
  addHouseAtGps: (lat: number, lng: number, accuracy: number | null) => void;
  openCreateAt: (lat: number, lng: number, accuracy?: number | null) => void;
  openEdit: (uid: string) => void;
  closeSheet: () => void;
  saveMarker: (data: HouseFormData) => void;
  updateMarker: (uid: string, data: HouseFormData) => void;
  deleteMarker: (uid: string) => void;
  undo: () => void;
  setNumberingMode: (mode: NumberingMode) => void;
  setDenseSettlement: (v: boolean) => void;
  setFollowGps: (v: boolean) => void;
  setMapLayer: (v: MapLayer) => void;
  setManualOrderUids: (uids: string[]) => void;
  moveManualOrder: (uid: string, direction: "up" | "down") => void;
  markDone: (uid: string) => void;
  getMarker: (uid: string) => HouseRecord | undefined;
  previewHouseNumber: (lat: number, lng: number) => string;
  undoDelete: () => void;
  addTrailCoordinate: (lat: number, lng: number) => void;
  clearTrail: () => void;
  toggleTrailVisibility: () => void;
};

const NakshaContext = createContext<NakshaContextValue | null>(null);
const MAX_HISTORY = 50;

export function NakshaProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [markers, setMarkers] = useState<HouseRecord[]>([]);
  const [numberingMode, setNumberingModeState] = useState<NumberingMode>("sequential");
  const [seqCounter, setSeqCounter] = useState(0);
  const [denseSettlement, setDenseSettlementState] = useState(true);
  const [followGps, setFollowGpsState] = useState(true);
  const [mapLayer, setMapLayerState] = useState<MapLayer>("street");
  const [manualOrderUids, setManualOrderUidsState] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<MarkerDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [undoDeleteAvailable, setUndoDeleteAvailable] = useState(false);
  const lastDeleted = useRef<HouseRecord | null>(null);
  const [highlightedUids, setHighlightedUids] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline",
  );
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimer = useRef<number | null>(null);
  const skipSave = useRef(true);
  const [trailCoordinates, setTrailCoordinates] = useState<TrailCoordinate[]>([]);
  const [trailVisible, setTrailVisibleState] = useState(true);
  const lastTrailCoordinate = useRef<TrailCoordinate | null>(null);

  useEffect(() => {
    const stored = loadNakshaState();
    setMarkers(stored.markers);
    setNumberingModeState(stored.numberingMode);
    setSeqCounter(stored.seqCounter);
    setDenseSettlementState(stored.denseSettlement);
    setFollowGpsState(stored.followGps);
    setMapLayerState(stored.mapLayer ?? "street");
    setManualOrderUidsState(stored.manualOrderUids);
    setHydrated(true);
    skipSave.current = false;
    // restore any in-progress draft saved by autosave
    try {
      const raw = localStorage.getItem("naksha-draft");
      if (raw) {
        const d = JSON.parse(raw) as MarkerDraft & { uid?: string };
        if (d && typeof d.lat === "number" && typeof d.lng === "number") {
          setDraft({ lat: d.lat, lng: d.lng, gpsAccuracy: d.gpsAccuracy ?? null, placementSource: d.placementSource ?? "manual", uid: d.uid });
          setSheetOpen(true);
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipSave.current || !hydrated) return;
    saveNakshaState({
      markers,
      numberingMode,
      seqCounter,
      denseSettlement,
      followGps,
      mapLayer,
      manualOrderUids,
    });
  }, [markers, numberingMode, seqCounter, denseSettlement, followGps, mapLayer, manualOrderUids, hydrated]);

  // autosave draft every 5s when sheet is open
  useEffect(() => {
    if (!sheetOpen || !draft) return;
    if (autosaveTimer.current) window.clearInterval(autosaveTimer.current);
    autosaveTimer.current = window.setInterval(() => {
      try {
        localStorage.setItem("naksha-draft", JSON.stringify(draft));
      } catch (e) {
        // ignore
      }
    }, 5000) as unknown as number;
    return () => {
      if (autosaveTimer.current) window.clearInterval(autosaveTimer.current);
      autosaveTimer.current = null;
    };
  }, [sheetOpen, draft]);

  // sync online/offline status
  useEffect(() => {
    const onOnline = () => setSyncStatus("online");
    const onOffline = () => setSyncStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const pushHistory = useCallback((action: HistoryAction) => {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), action]);
  }, []);

  const applyMarkers = useCallback(
    (next: HouseRecord[], nextCounter?: number, nextManual?: string[]) => {
      setMarkers(next);
      if (nextCounter != null) setSeqCounter(nextCounter);
      if (nextManual != null) setManualOrderUidsState(nextManual);
    },
    [],
  );

  const renumber = useCallback(
    (next: HouseRecord[], counter: number, manual: string[]) => {
      const result = renumberAll(next, numberingMode, counter, manual);
      const manualOut =
        numberingMode === "manual"
          ? result.markers.map((m) => m.uid)
          : manual.filter((uid) => result.markers.some((m) => m.uid === uid));
      return { ...result, manualOrderUids: manualOut };
    },
    [numberingMode],
  );

  // highlight nearby unsurveyed houses after saving a survey
  const highlightNearbyUnsurveyed = useCallback((center: HouseRecord) => {
    const R = 6371000;
    function haversineM(a: HouseRecord, b: HouseRecord) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    }
    const nearby = markers.filter((m) => m.uid !== center.uid && m.status !== "done" && haversineM(center, m) <= 80).map((m) => m.uid);
    if (nearby.length === 0) return;
    setHighlightedUids(nearby);
    window.setTimeout(() => setHighlightedUids([]), 20000);
  }, [markers]);

  const previewHouseNumber = useCallback(
    (lat: number, lng: number) =>
      previewNextHouseNumber(markers, numberingMode, seqCounter, lat, lng, manualOrderUids),
    [markers, numberingMode, seqCounter, manualOrderUids],
  );

  const openCreateAt = useCallback(
    (lat: number, lng: number, accuracy: number | null = null) => {
      setDraft({ lat, lng, gpsAccuracy: accuracy, placementSource: "manual" });
      setSelectedUid(null);
      setSheetOpen(true);
    },
    [],
  );

  const addHouseAtGps = useCallback(
    (lat: number, lng: number, accuracy: number | null) => {
      setDraft({ lat, lng, gpsAccuracy: accuracy, placementSource: "gps" });
      setSelectedUid(null);
      setSheetOpen(true);
    },
    [],
  );

  const openEdit = useCallback(
    (uid: string) => {
      const m = markers.find((x) => x.uid === uid);
      if (!m) return;
      setDraft({
        lat: m.lat,
        lng: m.lng,
        uid,
        gpsAccuracy: m.gpsAccuracy,
        placementSource: m.placementSource,
      });
      setSelectedUid(uid);
      setSheetOpen(true);
    },
    [markers],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setDraft(null);
  }, []);

  const buildRecord = useCallback(
    (
      base: Partial<HouseRecord> & { lat: number; lng: number; uid: string },
      data: HouseFormData,
    ): HouseRecord => {
      const now = Date.now();
      return {
        uid: base.uid,
        houseNumber: base.houseNumber ?? "H-000",
        seq: base.seq ?? 0,
        lat: base.lat,
        lng: base.lng,
        familyHeadName: data.familyHeadName.trim() || "Unnamed household",
        notes: data.notes.trim(),
        floorNumber: data.floorNumber ?? "",
        flatNumber: data.flatNumber ?? "",
        placementSource: base.placementSource ?? "gps",
        status: data.status,
        survey: { ...defaultSurvey(), ...data.survey },
        photoId: data.photoId,
        gpsAccuracy: base.gpsAccuracy ?? null,
        createdAt: base.createdAt ?? now,
        updatedAt: now,
      };
    },
    [],
  );

  const saveMarker = useCallback(
    async (data: HouseFormData) => {
      if (!draft) return;
      setIsSaving(true);
      const now = Date.now();

      try {
        if (draft.uid) {
          const existing = markers.find((m) => m.uid === draft.uid);
          if (!existing) return;

          let photoId = data.photoId;
          if (data.photoDataUrl) {
            await saveHousePhoto(existing.uid, data.photoDataUrl);
            photoId = existing.uid;
            if (existing.photoId && existing.photoId !== existing.uid) {
              void deleteHousePhoto(existing.photoId);
            }
          } else if (existing.photoId && existing.photoId !== data.photoId) {
            void deleteHousePhoto(existing.photoId);
          }

          const after = buildRecord(
            {
              ...existing,
              lat: draft.lat,
              lng: draft.lng,
              gpsAccuracy: draft.gpsAccuracy ?? existing.gpsAccuracy,
              placementSource: existing.placementSource ?? draft.placementSource,
            },
            { ...data, photoId },
          );
          const next = markers.map((m) => (m.uid === draft.uid ? after : m));
          const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
            next,
            seqCounter,
            manualOrderUids,
          );
          pushHistory({ type: "update", before: existing, after });
          applyMarkers(numbered, c, mo);
        } else {
          const { houseNumber, seq, seqCounter: nextCounter } = assignNumberForNew(
            markers,
            numberingMode,
            seqCounter,
            draft.lat,
            draft.lng,
            manualOrderUids,
          );
          const uid = crypto.randomUUID();
          let photoId = data.photoId;
          if (data.photoDataUrl) {
            await saveHousePhoto(uid, data.photoDataUrl);
            photoId = uid;
          }
          const marker = buildRecord(
            {
              uid,
              houseNumber,
              seq,
              lat: draft.lat,
              lng: draft.lng,
              gpsAccuracy: draft.gpsAccuracy,
              placementSource: draft.placementSource,
              createdAt: now,
            },
            { ...data, photoId },
          );
          const nextManual =
            numberingMode === "manual" ? [...manualOrderUids, uid] : manualOrderUids;
          const next = [...markers, marker];
          const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
            next,
            nextCounter,
            nextManual,
          );
          pushHistory({ type: "add", marker });
          applyMarkers(numbered, c, mo);
          try {
            localStorage.removeItem("naksha-draft");
          } catch (e) {}
          highlightNearbyUnsurveyed(marker);
        }
      } finally {
        setIsSaving(false);
      }
      closeSheet();
    },
    [
      draft,
      markers,
      numberingMode,
      seqCounter,
      manualOrderUids,
      buildRecord,
      renumber,
      pushHistory,
      applyMarkers,
      closeSheet,
    ],
  );

  const updateMarker = useCallback(
    (uid: string, data: HouseFormData) => {
      const existing = markers.find((m) => m.uid === uid);
      if (!existing) return;
      const after = buildRecord({ ...existing }, data);
      if (existing.photoId && existing.photoId !== data.photoId) {
        void deleteHousePhoto(existing.photoId);
      }
      const next = markers.map((m) => (m.uid === uid ? after : m));
      const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
        next,
        seqCounter,
        manualOrderUids,
      );
      pushHistory({ type: "update", before: existing, after });
      applyMarkers(numbered, c, mo);
      // if marked done, highlight nearby unsurveyed
      if (after.status === "done") highlightNearbyUnsurveyed(after);
    },
    [markers, buildRecord, renumber, seqCounter, manualOrderUids, pushHistory, applyMarkers],
  );

  const deleteMarker = useCallback(
    (uid: string) => {
      const existing = markers.find((m) => m.uid === uid);
      if (!existing) return;
      if (existing.photoId) void deleteHousePhoto(existing.photoId);
      const next = markers.filter((m) => m.uid !== uid);
      const nextManual = manualOrderUids.filter((id) => id !== uid);
      const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
        next,
        seqCounter,
        nextManual,
      );
      pushHistory({ type: "delete", marker: existing });
      applyMarkers(numbered, c, mo);
      // store last deleted for undo
      lastDeleted.current = existing;
      setUndoDeleteAvailable(true);
      window.setTimeout(() => {
        setUndoDeleteAvailable(false);
        lastDeleted.current = null;
      }, 8000);
      if (selectedUid === uid) setSelectedUid(null);
      closeSheet();
    },
    [
      markers,
      manualOrderUids,
      seqCounter,
      renumber,
      pushHistory,
      applyMarkers,
      selectedUid,
      closeSheet,
    ],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1]!;
      const rest = h.slice(0, -1);

      if (last.type === "add") {
        const next = markers.filter((m) => m.uid !== last.marker.uid);
        const nextManual = manualOrderUids.filter((id) => id !== last.marker.uid);
        const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
          next,
          seqCounter,
          nextManual,
        );
        applyMarkers(numbered, c, mo);
      } else if (last.type === "delete") {
        const next = [...markers, last.marker];
        const nextManual = [...manualOrderUids, last.marker.uid];
        const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
          next,
          seqCounter,
          nextManual,
        );
        applyMarkers(numbered, c, mo);
      } else if (last.type === "update") {
        applyMarkers(markers.map((m) => (m.uid === last.before.uid ? last.before : m)));
      }
      return rest;
    });
  }, [markers, manualOrderUids, seqCounter, renumber, applyMarkers]);

  const undoDelete = useCallback(() => {
    const d = lastDeleted.current;
    if (!d) return;
    const next = [...markers, d];
    const nextManual = [...manualOrderUids, d.uid];
    const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
      next,
      seqCounter,
      nextManual,
    );
    applyMarkers(numbered, c, mo);
    pushHistory({ type: "add", marker: d });
    lastDeleted.current = null;
    setUndoDeleteAvailable(false);
  }, [markers, manualOrderUids, seqCounter, renumber, applyMarkers, pushHistory]);

  const setNumberingMode = useCallback(
    (mode: NumberingMode) => {
      setNumberingModeState(mode);
      const { markers: numbered, seqCounter: c, manualOrderUids: mo } = renumber(
        markers,
        seqCounter,
        manualOrderUids,
      );
      applyMarkers(numbered, c, mo);
    },
    [markers, seqCounter, manualOrderUids, renumber, applyMarkers],
  );

  const setDenseSettlement = useCallback((v: boolean) => setDenseSettlementState(v), []);
  const setFollowGps = useCallback((v: boolean) => setFollowGpsState(v), []);
  const setMapLayer = useCallback((v: MapLayer) => setMapLayerState(v), []);

  const setManualOrderUids = useCallback(
    (uids: string[]) => {
      setManualOrderUidsState(uids);
      if (numberingMode === "manual") {
        const { markers: numbered, seqCounter: c } = renumberAll(markers, "manual", seqCounter, uids);
        applyMarkers(numbered, c, uids);
      }
    },
    [markers, numberingMode, seqCounter, applyMarkers],
  );

  const moveManualOrder = useCallback(
    (uid: string, direction: "up" | "down") => {
      const idx = manualOrderUids.indexOf(uid);
      if (idx < 0) return;
      const next = [...manualOrderUids];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return;
      [next[idx], next[swap]] = [next[swap]!, next[idx]!];
      setManualOrderUids(next);
    },
    [manualOrderUids, setManualOrderUids],
  );

  const markDone = useCallback(
    (uid: string) => {
      const m = markers.find((x) => x.uid === uid);
      if (!m) return;
      applyMarkers(markers.map((x) => (x.uid === uid ? { ...x, status: "done", updatedAt: Date.now() } : x)));
      // highlight nearby unsurveyed
      if (m) highlightNearbyUnsurveyed(m);
    },
    [markers, applyMarkers],
  );

  const getMarker = useCallback((uid: string) => markers.find((m) => m.uid === uid), [markers]);

  const addTrailCoordinate = useCallback((lat: number, lng: number) => {
    const now = Date.now();
    const lastCoord = lastTrailCoordinate.current;
    // Only add if significantly different from last point (debounce to avoid too many points)
    const minDistance = 0.00005; // ~5 meters
    if (lastCoord) {
      const dlat = Math.abs(lat - lastCoord.lat);
      const dlng = Math.abs(lng - lastCoord.lng);
      if (dlat < minDistance && dlng < minDistance) {
        return;
      }
    }
    const newCoord: TrailCoordinate = { lat, lng, timestamp: now };
    lastTrailCoordinate.current = newCoord;
    setTrailCoordinates((prev) => [...prev, newCoord]);
  }, []);

  const clearTrail = useCallback(() => {
    setTrailCoordinates([]);
    lastTrailCoordinate.current = null;
  }, []);

  const toggleTrailVisibility = useCallback(() => {
    setTrailVisibleState((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      markers,
      numberingMode,
      highlightedUids,
      denseSettlement,
      followGps,
      mapLayer,
      manualOrderUids,
      selectedUid,
      sheetOpen,
      draft,
      syncStatus,
      isSaving,
      undoDeleteAvailable,
      canUndo: history.length > 0,
      hydrated,
      trailCoordinates,
      trailVisible,
      setSelectedUid,
      addHouseAtGps,
      openCreateAt,
      openEdit,
      closeSheet,
      saveMarker,
      updateMarker,
      deleteMarker,
      undo,
      undoDelete,
      setNumberingMode,
      setDenseSettlement,
      setFollowGps,
      setMapLayer,
      setManualOrderUids,
      moveManualOrder,
      markDone,
      getMarker,
      previewHouseNumber,
      addTrailCoordinate,
      clearTrail,
      toggleTrailVisibility,
    }),
    [
      markers,
      numberingMode,
      highlightedUids,
      denseSettlement,
      followGps,
      mapLayer,
      manualOrderUids,
      selectedUid,
      sheetOpen,
      draft,
      syncStatus,
      isSaving,
      undoDeleteAvailable,
      history.length,
      hydrated,
      trailCoordinates,
      trailVisible,
      addHouseAtGps,
      openCreateAt,
      openEdit,
      closeSheet,
      saveMarker,
      updateMarker,
      deleteMarker,
      undo,
      setNumberingMode,
      setManualOrderUids,
      moveManualOrder,
      markDone,
      getMarker,
      previewHouseNumber,
      addTrailCoordinate,
      clearTrail,
      toggleTrailVisibility,
    ],
  );

  return <NakshaContext.Provider value={value}>{children}</NakshaContext.Provider>;
}

export function useNaksha() {
  const ctx = useContext(NakshaContext);
  if (!ctx) throw new Error("useNaksha must be used within NakshaProvider");
  return ctx;
}
