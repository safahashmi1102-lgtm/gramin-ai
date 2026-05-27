import AsyncStorage from "@react-native-async-storage/async-storage";

export type MarkerStatus = "done" | "pending" | "ai";

export type HouseMarker = {
  id: string;
  latitude: number;
  longitude: number;
  status: MarkerStatus;
  seq: number;
};

const MARKERS_KEY = "@naksha_ai/markers";
const COUNTER_KEY = "@naksha_ai/counter";

export function formatHouseId(seq: number): string {
  return `H-${String(seq).padStart(3, "0")}`;
}

export async function loadMarkers(): Promise<HouseMarker[]> {
  const raw = await AsyncStorage.getItem(MARKERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HouseMarker[];
  } catch {
    return [];
  }
}

export async function saveMarkers(markers: HouseMarker[]): Promise<void> {
  await AsyncStorage.setItem(MARKERS_KEY, JSON.stringify(markers));
}

export async function loadCounter(): Promise<number> {
  const raw = await AsyncStorage.getItem(COUNTER_KEY);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function saveCounter(counter: number): Promise<void> {
  await AsyncStorage.setItem(COUNTER_KEY, String(counter));
}

export async function getNextSeq(): Promise<number> {
  const current = await loadCounter();
  const next = current + 1;
  await saveCounter(next);
  return next;
}
