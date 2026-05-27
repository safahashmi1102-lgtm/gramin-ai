import type { HouseRecord, NumberingMode } from "./naksha-types";
import { defaultSurvey } from "./naksha-types";

export function formatHouseNumber(seq: number): string {
  return `H-${String(seq).padStart(3, "0")}`;
}

function rowThreshold(markers: HouseRecord[]): number {
  if (markers.length < 2) return 0.00015;
  const lats = markers.map((m) => m.lat).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < lats.length; i++) gaps.push(lats[i]! - lats[i - 1]!);
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)] ?? 0.00015;
  return Math.max(median * 0.6, 0.00008);
}

export function applySnakeNumbering(markers: HouseRecord[]): HouseRecord[] {
  if (markers.length === 0) return [];

  const threshold = rowThreshold(markers);
  const byNorth = [...markers].sort((a, b) => b.lat - a.lat);

  const rows: HouseRecord[][] = [];
  for (const m of byNorth) {
    const last = rows[rows.length - 1];
    if (!last || Math.abs(m.lat - last[0]!.lat) > threshold) {
      rows.push([m]);
    } else {
      last.push(m);
    }
  }

  const numbered: HouseRecord[] = [];
  let seq = 1;
  rows.forEach((row, rowIndex) => {
    const sorted = [...row].sort((a, b) => a.lng - b.lng);
    const order = rowIndex % 2 === 0 ? sorted : sorted.reverse();
    for (const m of order) {
      numbered.push({
        ...m,
        seq,
        houseNumber: formatHouseNumber(seq),
        updatedAt: Date.now(),
      });
      seq++;
    }
  });
  return numbered;
}

export function applyManualNumbering(
  markers: HouseRecord[],
  manualOrderUids: string[],
): HouseRecord[] {
  const order = manualOrderUids.filter((uid) => markers.some((m) => m.uid === uid));
  const remaining = markers
    .filter((m) => !order.includes(m.uid))
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => m.uid);
  const fullOrder = [...order, ...remaining];
  return fullOrder.map((uid, i) => {
    const m = markers.find((x) => x.uid === uid)!;
    const seq = i + 1;
    return { ...m, seq, houseNumber: formatHouseNumber(seq), updatedAt: Date.now() };
  });
}

export function applySequentialNumbering(
  markers: HouseRecord[],
  seqCounter: number,
): { markers: HouseRecord[]; seqCounter: number } {
  const sorted = [...markers].sort((a, b) => a.createdAt - b.createdAt);
  const next = sorted.map((m, i) => ({
    ...m,
    seq: i + 1,
    houseNumber: formatHouseNumber(i + 1),
  }));
  // seqCounter reflects current highest assigned sequence based on existing markers
  return { markers: next, seqCounter: next.length };
}

function previewPlaceholder(lat: number, lng: number): HouseRecord {
  return {
    uid: "__preview__",
    houseNumber: "",
    seq: 0,
    lat,
    lng,
    familyHeadName: "",
    notes: "",
    floorNumber: "",
    flatNumber: "",
    placementSource: "manual",
    status: "pending",
    survey: defaultSurvey(),
    photoId: null,
    gpsAccuracy: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function previewNextHouseNumber(
  markers: HouseRecord[],
  mode: NumberingMode,
  seqCounter: number,
  lat: number,
  lng: number,
  manualOrderUids: string[],
): string {
  if (mode === "sequential") {
    const maxSeq = markers.reduce((max, m) => Math.max(max, m.seq || 0), 0);
    return formatHouseNumber(maxSeq + 1);
  }
  if (mode === "manual") return formatHouseNumber(manualOrderUids.length + 1);
  const numbered = applySnakeNumbering([...markers, previewPlaceholder(lat, lng)]);
  const found = numbered.find((m) => m.uid === "__preview__");
  return found?.houseNumber ?? formatHouseNumber(markers.length + 1);
}

export function assignNumberForNew(
  markers: HouseRecord[],
  mode: NumberingMode,
  seqCounter: number,
  lat: number,
  lng: number,
  manualOrderUids: string[],
): { houseNumber: string; seq: number; seqCounter: number } {
  const houseNumber = previewNextHouseNumber(
    markers,
    mode,
    seqCounter,
    lat,
    lng,
    manualOrderUids,
  );
  const seq = parseInt(houseNumber.replace("H-", ""), 10) || markers.length + 1;
  if (mode === "sequential") {
    // derive seqCounter from current markers to ensure numbering resets when all deleted
    return { houseNumber, seq, seqCounter: seq };
  }
  // For other modes, keep seqCounter at least as large as seq
  return { houseNumber, seq, seqCounter: Math.max(seqCounter, seq) };
}

export function renumberAll(
  markers: HouseRecord[],
  mode: NumberingMode,
  seqCounter: number,
  manualOrderUids: string[],
): { markers: HouseRecord[]; seqCounter: number } {
  if (mode === "snake") {
    const numbered = applySnakeNumbering(markers);
    return { markers: numbered, seqCounter: numbered.length };
  }
  if (mode === "manual") {
    const numbered = applyManualNumbering(markers, manualOrderUids);
    return { markers: numbered, seqCounter: numbered.length };
  }
  return applySequentialNumbering(markers, seqCounter);
}
