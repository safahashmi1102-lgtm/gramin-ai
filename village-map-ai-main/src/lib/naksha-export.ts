import type { HouseRecord, NakshaPersistedState } from "./naksha-types";

export function exportJson(state: NakshaPersistedState): string {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  );
}

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function exportCsv(markers: HouseRecord[]): string {
  const headers = [
    "house_number",
    "latitude",
    "longitude",
    "family_head",
    "floor",
    "flat",
    "notes",
    "status",
    "house_type",
    "family_members",
    "tap_water",
    "electricity",
    "farm_land",
    "school_access",
    "gps_accuracy_m",
    "created_at",
    "updated_at",
  ];
  const rows = markers.map((m) =>
    [
      m.houseNumber,
      m.lat,
      m.lng,
      m.familyHeadName,
      m.floorNumber,
      m.flatNumber,
      m.notes,
      m.status,
      m.survey.houseType,
      m.survey.familyMembers,
      m.survey.tapWater ? "yes" : "no",
      m.survey.electricity ? "yes" : "no",
      m.survey.farmLand ? "yes" : "no",
      m.survey.schoolAccess ? "yes" : "no",
      m.gpsAccuracy ?? "",
      new Date(m.createdAt).toISOString(),
      new Date(m.updatedAt).toISOString(),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportJson(raw: string): NakshaPersistedState | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const markers = Array.isArray(parsed.markers) ? parsed.markers : null;
    if (!markers) return null;
    return {
      markers: markers as HouseRecord[],
      numberingMode:
        parsed.numberingMode === "snake" || parsed.numberingMode === "manual"
          ? parsed.numberingMode
          : "sequential",
      seqCounter: typeof parsed.seqCounter === "number" ? parsed.seqCounter : markers.length,
      denseSettlement: parsed.denseSettlement !== false,
      followGps: parsed.followGps !== false,
      mapLayer: parsed.mapLayer === "satellite" ? "satellite" : "street",
      manualOrderUids: Array.isArray(parsed.manualOrderUids)
        ? (parsed.manualOrderUids as string[])
        : [],
    };
  } catch {
    return null;
  }
}
