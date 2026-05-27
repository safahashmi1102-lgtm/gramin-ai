import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  formatHouseId,
  getNextSeq,
  loadMarkers,
  saveMarkers,
  type HouseMarker,
  type MarkerStatus,
} from "../storage/markers";

type MarkersContextValue = {
  markers: HouseMarker[];
  loading: boolean;
  addMarker: (latitude: number, longitude: number, status?: MarkerStatus) => Promise<HouseMarker>;
  removeMarker: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const MarkersContext = createContext<MarkersContextValue | null>(null);

export function MarkersProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<HouseMarker[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = await loadMarkers();
    setMarkers(stored);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const persist = useCallback(async (next: HouseMarker[]) => {
    setMarkers(next);
    await saveMarkers(next);
  }, []);

  const addMarker = useCallback(
    async (latitude: number, longitude: number, status: MarkerStatus = "pending") => {
      const seq = await getNextSeq();
      const marker: HouseMarker = {
        id: formatHouseId(seq),
        latitude,
        longitude,
        status,
        seq,
      };
      let created = marker;
      setMarkers((prev) => {
        const next = [...prev, marker];
        created = marker;
        void saveMarkers(next);
        return next;
      });
      return created;
    },
    [],
  );

  const removeMarker = useCallback(
    async (id: string) => {
      await persist(markers.filter((m) => m.id !== id));
    },
    [markers, persist],
  );

  const value = useMemo(
    () => ({ markers, loading, addMarker, removeMarker, refresh }),
    [markers, loading, addMarker, removeMarker, refresh],
  );

  return <MarkersContext.Provider value={value}>{children}</MarkersContext.Provider>;
}

export function useMarkers() {
  const ctx = useContext(MarkersContext);
  if (!ctx) throw new Error("useMarkers must be used within MarkersProvider");
  return ctx;
}
