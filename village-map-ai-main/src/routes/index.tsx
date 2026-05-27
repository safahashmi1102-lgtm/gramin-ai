import { createFileRoute } from "@tanstack/react-router";
import html2canvas from "html2canvas";
import {
  MapPin,
  Home,
  ClipboardList,
  BarChart3,
  Sparkles,
  Navigation,
  Search,
  Plus,
  Users,
  Droplet,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Camera,
  Mic,
  ArrowLeft,
  Compass,
  Layers,
  Wheat,
  GraduationCap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CoordNavigateSheet } from "@/components/map/CoordNavigateSheet";
import { ManualOrderSheet } from "@/components/map/ManualOrderSheet";
import { MapToolsMenu } from "@/components/map/MapToolsMenu";
import { MarkerSheet } from "@/components/map/MarkerSheet";
import { VillageMap } from "@/components/map/VillageMap";
import { NakshaProvider, useNaksha } from "@/context/NakshaContext";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import type { HouseFormData, HouseRecord, MarkerStatus, SurveyAnswers } from "@/lib/naksha-types";
import { defaultSurvey } from "@/lib/naksha-types";
import { exportCsv, exportJson, downloadText, parseImportJson } from "@/lib/naksha-export";
import { saveNakshaState } from "@/lib/naksha-storage";

export const Route = createFileRoute("/")({
  component: App,
});

type Screen = "map" | "survey" | "households" | "dashboard";

function App() {
  const [screen, setScreen] = useState<Screen>("map");
  const [activeSurveyUid, setActiveSurveyUid] = useState<string | null>(null);

  return (
    <NakshaProvider>
      <AppShell
        screen={screen}
        setScreen={setScreen}
        activeSurveyUid={activeSurveyUid}
        setActiveSurveyUid={setActiveSurveyUid}
      />
      <MarkerSheet />
    </NakshaProvider>
  );
}

function AppShell({
  screen,
  setScreen,
  activeSurveyUid,
  setActiveSurveyUid,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  activeSurveyUid: string | null;
  setActiveSurveyUid: (uid: string | null) => void;
}) {
  const { undo, canUndo, markers } = useNaksha();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, canUndo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50 py-4 sm:py-10 px-2 flex items-start justify-center">
      <div
        className="w-full max-w-[420px] bg-background rounded-[2.25rem] shadow-elevated overflow-hidden relative border border-border/60 grain"
        style={{ height: "min(900px, 95vh)" }}
      >
        <StatusBar />
        <div className="h-[calc(100%-44px-72px)] overflow-y-auto overflow-x-hidden">
          {screen === "map" && (
            <MapScreen />
          )}
          {screen === "survey" && (
            <SurveyScreen
              houseUid={activeSurveyUid}
              onBack={() => setScreen("map")}
            />
          )}
          {screen === "households" && (
            <HouseholdsScreen
              onOpenHouse={(uid) => {
                setActiveSurveyUid(uid);
                setScreen("survey");
              }}
            />
          )}
          {screen === "dashboard" && <DashboardScreen />}
        </div>
        <BottomNav
          screen={screen}
          setScreen={setScreen}
          onSurveyTap={() => {
            const last = markers[markers.length - 1];
            setActiveSurveyUid(last?.uid ?? null);
            setScreen("survey");
          }}
        />
      </div>
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="h-11 px-6 flex items-center justify-between text-[13px] font-semibold text-foreground">
      <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      <span />
    </div>
  );
}

function MapScreen() {
  const {
    markers,
    addHouseAtGps,
    openCreateAt,
    openEdit,
    numberingMode,
    setNumberingMode,
    denseSettlement,
    setDenseSettlement,
    followGps,
    setFollowGps,
    mapLayer,
    setMapLayer,
    manualOrderUids,
    undo,
    canUndo,
    hydrated,
    syncStatus,
    isSaving,
  } = useNaksha();
  const { position, label, accuracyLabel, watching, error: gpsError, refresh } = useGeolocation();
  const { place } = useReverseGeocode(position?.lat ?? null, position?.lng ?? null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [coordOpen, setCoordOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [centerOnUserSignal, setCenterOnUserSignal] = useState(0);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [navigateSignal, setNavigateSignal] = useState(0);
  const [navigateTarget, setNavigateTarget] = useState<{ lat: number; lng: number } | null>(null);

  const doneCount = markers.filter((m) => m.status === "done").length;
  const pendingCount = markers.filter((m) => m.status === "pending").length;

  const handleAddHouse = useCallback(() => {
    if (!position) {
      refresh();
      alert(
        gpsError ??
          "GPS not ready. Allow location access, wait a few seconds outdoors, then try again.",
      );
      return;
    }
    addHouseAtGps(position.lat, position.lng, position.accuracy);
  }, [position, addHouseAtGps, refresh, gpsError]);

  const exportMap = useCallback(async () => {
    const el = mapContainerRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `naksha-map-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  const exportAllJson = useCallback(() => {
    downloadText(
      `naksha-houses-${new Date().toISOString().slice(0, 10)}.json`,
      exportJson({
        markers,
        numberingMode,
        seqCounter: markers.length,
        denseSettlement,
        followGps,
        mapLayer,
        manualOrderUids,
      }),
      "application/json",
    );
  }, [markers, numberingMode, denseSettlement, followGps, mapLayer, manualOrderUids]);

  const exportAllCsv = useCallback(() => {
    downloadText(
      `naksha-houses-${new Date().toISOString().slice(0, 10)}.csv`,
      exportCsv(markers),
      "text/csv",
    );
  }, [markers]);

  const importAllJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const raw = await file.text();
      const next = parseImportJson(raw);
      if (!next) {
        alert("Invalid Naksha JSON file.");
        return;
      }
      const ok = window.confirm(
        "Import will replace your current saved houses in this browser. Continue?",
      );
      if (!ok) return;
      saveNakshaState(next);
      window.location.reload();
    };
    input.click();
  }, []);

  return (
    <div className="relative">
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Surveying
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {place?.city !== "—" ? place?.city : "Locating…"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {place?.district !== "—" ? place?.district : "District"} ·{" "}
            {place?.state !== "—" ? place?.state : "State"} · {label}
            {!watching && position === null ? " · enable GPS" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <span className="text-[12px]">🟡</span>
                  <span className="text-[11px]">Saving</span>
                </>
              ) : syncStatus === "online" ? (
                <>
                  <span className="text-[12px]">🟢</span>
                  <span className="text-[11px]">Online</span>
                </>
              ) : (
                <>
                  <span className="text-[12px]">🔴</span>
                  <span className="text-[11px]">Offline</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCoordOpen(true)}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"
            aria-label="Go to coordinates"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-4 rounded-[1.75rem] overflow-hidden relative h-[420px] shadow-soft border border-border/60">
        {hydrated ? (
          <VillageMap
            markers={markers}
            userPosition={position}
            denseSettlement={denseSettlement}
            followGps={followGps}
            mapLayer={mapLayer}
            onMapClick={(lat, lng) => openCreateAt(lat, lng, null)}
            onMarkerClick={openEdit}
            centerOnUserSignal={centerOnUserSignal}
            fitAllSignal={fitAllSignal}
            navigateSignal={navigateSignal}
            navigateTarget={navigateTarget}
            mapContainerRef={mapContainerRef}
          />
        ) : (
          <div className="absolute inset-0 bg-topo animate-pulse" />
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[400]">
          <MapBtn onClick={() => setToolsOpen((o) => !o)} aria-label="Map tools">
            <Layers className="h-4 w-4" />
          </MapBtn>
          <MapBtn
            onClick={() => setFitAllSignal((n) => n + 1)}
            aria-label="Fit all houses"
          >
            <Compass className="h-4 w-4" />
          </MapBtn>
          <MapBtn
            onClick={() => setCenterOnUserSignal((n) => n + 1)}
            aria-label="Center on GPS"
          >
            <Navigation className="h-4 w-4 text-primary" />
          </MapBtn>
        </div>

        <MapToolsMenu
          open={toolsOpen}
          onClose={() => setToolsOpen(false)}
          numberingMode={numberingMode}
          denseSettlement={denseSettlement}
          followGps={followGps}
          mapLayer={mapLayer}
          onNumberingMode={setNumberingMode}
          onDenseSettlement={setDenseSettlement}
          onFollowGps={setFollowGps}
          onMapLayer={setMapLayer}
          onManualOrder={() => setManualOpen(true)}
          onNavigate={() => setCoordOpen(true)}
          onUndo={undo}
          onExport={exportMap}
          onExportJson={exportAllJson}
          onExportCsv={exportAllCsv}
          onImportJson={importAllJson}
          canUndo={canUndo}
          exporting={exporting}
        />

        <button
          type="button"
          onClick={handleAddHouse}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[450] flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-elevated border-2 border-primary-foreground/20 active:scale-[0.98] transition-transform min-w-[200px] justify-center"
          aria-label="Add house at current GPS location"
        >
          <Home className="h-6 w-6" strokeWidth={2.5} />
          Add House
        </button>

        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-3 text-[10px] font-medium shadow-soft z-[400] pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Surveyed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            AI
          </span>
        </div>

        <div className="absolute bottom-2 left-3 right-3 z-[400] pointer-events-none">
          <p className="text-center text-[9px] font-medium text-foreground/70 bg-background/85 backdrop-blur rounded-full py-1 px-2 shadow-soft">
            Stand at doorway · Add House · {followGps ? "GPS following" : "GPS paused"}
          </p>
        </div>
      </div>

      <CoordNavigateSheet
        open={coordOpen}
        onClose={() => setCoordOpen(false)}
        onGo={(lat, lng) => {
          setNavigateTarget({ lat, lng });
          setNavigateSignal((n) => n + 1);
        }}
      />
      <ManualOrderSheet open={manualOpen} onClose={() => setManualOpen(false)} />

      <div className="mx-4 mt-4 slide-up">
        <div className="rounded-2xl bg-foreground text-background p-4 relative overflow-hidden shadow-elevated">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-background/60 font-semibold">
                  Naksha AI
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                  {markers.length} saved
                </span>
              </div>
              <p className="text-sm font-medium mt-1 leading-snug">
                {markers.length === 0
                  ? "Walk to each structure, press Add House, and confirm manually — no map auto-detection."
                  : `${pendingCount} pending · ${doneCount} surveyed · GPS ${accuracyLabel}${denseSettlement ? " · dense mode" : ""}`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setToolsOpen(true)}
                  className="text-xs font-semibold bg-background text-foreground px-3 py-1.5 rounded-lg"
                >
                  Map tools
                </button>
                <button
                  type="button"
                  onClick={exportMap}
                  disabled={exporting}
                  className="text-xs font-semibold text-background/70 px-2 py-1.5 disabled:opacity-50"
                >
                  {exporting ? "Exporting…" : "Export PNG"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-2 mb-6">
        <Stat label="Done today" value={String(doneCount).padStart(2, "0")} />
        <Stat label="Remaining" value={String(pendingCount).padStart(2, "0")} />
        <Stat label="Accuracy" value={accuracyLabel} />
      </div>
    </div>
  );
}

function MapBtn({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 w-9 rounded-xl bg-background/95 backdrop-blur shadow-soft flex items-center justify-center border border-border/50"
      {...rest}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3 text-center shadow-soft">
      <p className="text-lg font-bold font-display text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}


function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-card border border-border px-3.5 py-3 text-sm font-medium text-foreground shadow-soft outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function AmenityChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Droplet;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 flex items-center gap-2 border text-xs font-medium ${
        active
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-card border-border text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
function SurveyScreen({
  houseUid,
  onBack,
}: {
  houseUid: string | null;
  onBack: () => void;
}) {
  const { getMarker, updateMarker, deleteMarker, syncStatus, isSaving, markDone } = useNaksha();
  const marker = useMemo(
    () => (houseUid ? getMarker(houseUid) : undefined),
    [houseUid, getMarker],
  );

  const [step, setStep] = useState(0);
  const [survey, setSurvey] = useState<SurveyAnswers>(() => defaultSurvey());
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!marker) {
      setSurvey(defaultSurvey());
      setStep(0);
      setLoadedUid(null);
      return;
    }

    if (marker.uid === loadedUid) return;

    let nextSurvey = { ...defaultSurvey(), ...marker.survey };
    try {
      const raw = localStorage.getItem(`survey-draft-${marker.uid}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SurveyAnswers>;
        if (parsed && typeof parsed === "object") {
          nextSurvey = { ...nextSurvey, ...parsed };
        }
      }
    } catch {
      // ignore malformed draft data
    }

    setSurvey(nextSurvey);
    setStep(0);
    setLoadedUid(marker.uid);
  }, [marker, loadedUid]);

  const hasUnsavedSurvey = useMemo(() => {
    if (!marker) return false;
    return JSON.stringify(marker.survey) !== JSON.stringify(survey);
  }, [marker, survey]);

  const saveSurvey = useCallback(() => {
    if (!marker || !hasUnsavedSurvey) return;

    updateMarker(marker.uid, {
      familyHeadName: marker.familyHeadName,
      notes: marker.notes,
      floorNumber: marker.floorNumber,
      flatNumber: marker.flatNumber,
      status: marker.status,
      photoId: marker.photoId,
      survey,
    });

    try {
      localStorage.setItem(`survey-draft-${marker.uid}`, JSON.stringify(survey));
    } catch {
      // ignore storage errors
    }
  }, [marker, hasUnsavedSurvey, survey, updateMarker]);

  useEffect(() => {
    if (!marker) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(`survey-draft-${marker.uid}`, JSON.stringify(survey));
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [marker, survey]);

  useEffect(() => {
    return () => {
      saveSurvey();
    };
  }, [saveSurvey]);

  const updateSurvey = (next: Partial<SurveyAnswers>) => {
    setSurvey((current) => ({ ...current, ...next }));
  };

  const handleChangeNumber = (key: "dwellingRooms" | "marriedCouples" | "totalPersons", value: string) => {
    const next = value.trim() === "" ? null : Number(value);
    setSurvey((current) => ({
      ...current,
      [key]: next,
    }));
  };

  const stepTitles = [
    "Identification",
    "Building details",
    "Household details",
    "Water & sanitation",
    "Assets & final",
  ];

  const stepFields: string[][] = [
    ["buildingNumber", "censusHouseNumber", "householdNumber", "useOfCensusHouse", "condition", "ownership"],
    ["floorMaterial", "wallMaterial", "roofMaterial", "dwellingRooms", "marriedCouples"],
    ["totalPersons", "headName", "headSex", "category", "censusHouseOwnershipStatus"],
    ["mainDrinkingSource", "drinkingWaterAvailable", "mainLightingSource", "accessToLatrine", "latrineType", "wasteWaterOutlet", "bathingFacility", "kitchenAvailability", "cookingLocation", "mainCookingFuel"],
    ["hasRadio", "hasTv", "hasInternet", "hasLaptop", "hasMobile", "hasBicycle", "hasScooter", "hasCar", "mainCereal", "mobileNumber"],
  ];

  const getQuestionNumber = (key: string) => {
    const stepIndex = stepFields.findIndex((s) => s.includes(key));
    if (stepIndex === -1) return 0;
    const offset = stepFields.slice(0, stepIndex).reduce((s, a) => s + a.length, 0);
    return offset + stepFields[stepIndex].indexOf(key) + 1;
  };

  const qLabel = (key: string, title: string) => {
    const num = getQuestionNumber(key);
    return num > 0 ? questionLabel(num, title) : title;
  };

  const handlePrevious = () => {
    if (step === 0) return;
    saveSurvey();
    setStep((current) => current - 1);
  };

  const handleNext = () => {
    if (step < stepTitles.length - 1) {
      saveSurvey();
      setStep((current) => current + 1);
      return;
    }

    saveSurvey();
    if (marker && marker.status !== "done") {
      markDone(marker.uid);
    }
    onBack();
  };

  const handleDelete = () => {
    if (!marker) return;
    if (window.confirm("Delete this household and all survey responses?")) {
      deleteMarker(marker.uid);
      onBack();
    }
  };

  const syncLabel = isSaving
    ? "🟡 Saving"
    : syncStatus === "online"
    ? "🟢 Synced"
    : "🔴 Offline";

  const renderChips = (
    label: string,
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (value: string) => void,
  ) => (
    <SurveyField label={label}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`rounded-2xl border px-3 py-3 text-sm text-left ${
              currentValue === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </SurveyField>
  );

  const questionLabel = (number: number, title: string) => `${number}. ${title}`;

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
    placeholder?: string,
  ) => (
    <SurveyField label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      >
        <option value="">{placeholder ?? "Select an option"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </SurveyField>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <SurveyField label={qLabel("buildingNumber", "Building number")}>
              <input
                type="text"
                value={survey.buildingNumber}
                onChange={(e) => updateSurvey({ buildingNumber: e.target.value })}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="e.g. B-12"
              />
            </SurveyField>
            <SurveyField label={qLabel("censusHouseNumber", "Census house number")}>
              <input
                type="text"
                value={survey.censusHouseNumber}
                onChange={(e) => updateSurvey({ censusHouseNumber: e.target.value })}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Census register ID"
              />
            </SurveyField>
            <SurveyField label={qLabel("householdNumber", "Household number")}>
              <input
                type="text"
                value={survey.householdNumber}
                onChange={(e) => updateSurvey({ householdNumber: e.target.value })}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Household identifier"
              />
            </SurveyField>
            {renderSelect(
              qLabel("useOfCensusHouse", "Use of census house"),
              survey.useOfCensusHouse,
              (value) => updateSurvey({ useOfCensusHouse: value }),
              [
                "Factory/Workshed",
                "Hospital/Dispensary",
                "Hotel/Lodge/Guesthouse",
                "Other non residing use",
                "Place of Worship",
                "Reside",
                "Reside + Work",
                "School/College",
                "Shop/Workshop",
                "Vacant",
              ],
              "Select house use",
            )}
            {renderChips(
              qLabel("condition", "Condition of census house"),
              [
                { label: "Good", value: "Good" },
                { label: "Fair", value: "Fair" },
                { label: "Poor", value: "Poor" },
                { label: "Needs repair", value: "Needs repair" },
              ],
              survey.condition,
              (value) => updateSurvey({ condition: value }),
            )}
            {renderChips(
              qLabel("ownership", "Ownership status"),
              [
                { label: "Lease", value: "Lease" },
                { label: "Other", value: "Other" },
                { label: "Owned", value: "Owned" },
                { label: "Rented", value: "Rented" },
              ],
              survey.ownership,
              (value) => updateSurvey({ ownership: value }),
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            {renderSelect(
              qLabel("floorMaterial", "Predominant material of floor"),
              survey.floorMaterial,
              (value) => updateSurvey({ floorMaterial: value }),
              ["Brick", "Cement", "Mud", "Others", "Stone", "Tile", "Wood"],
              "Choose floor material",
            )}
            {renderSelect(
              qLabel("wallMaterial", "Predominant material of wall"),
              survey.wallMaterial,
              (value) => updateSurvey({ wallMaterial: value }),
              ["Bamboo", "Brick", "Cloth", "Concrete", "Grass", "Mud", "Plastic", "Plastered stone", "Unplastered stone"],
              "Choose wall material",
            )}
            {renderSelect(
              qLabel("roofMaterial", "Predominant material of roof"),
              survey.roofMaterial,
              (value) => updateSurvey({ roofMaterial: value }),
              ["Bamboo", "Brick", "Cloth", "Concrete", "Mud", "Slate", "Stone", "Wood"],
              "Choose roof material",
            )}
            <div className="grid grid-cols-2 gap-3">
              <SurveyField label={qLabel("dwellingRooms", "Number of dwelling rooms")}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSurvey({ dwellingRooms: Math.max(0, (survey.dwellingRooms ?? 0) - 1) })
                    }
                    className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                  >
                    −
                  </button>
                  <div className="min-w-[56px] rounded-2xl border border-border bg-background px-4 py-3 text-center text-sm">
                    {survey.dwellingRooms ?? 0}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSurvey({ dwellingRooms: (survey.dwellingRooms ?? 0) + 1 })
                    }
                    className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                  >
                    +
                  </button>
                </div>
              </SurveyField>
              <SurveyField label={qLabel("marriedCouples", "Number of married couples")}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSurvey({ marriedCouples: Math.max(0, (survey.marriedCouples ?? 0) - 1) })
                    }
                    className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                  >
                    −
                  </button>
                  <div className="min-w-[56px] rounded-2xl border border-border bg-background px-4 py-3 text-center text-sm">
                    {survey.marriedCouples ?? 0}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSurvey({ marriedCouples: (survey.marriedCouples ?? 0) + 1 })
                    }
                    className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                  >
                    +
                  </button>
                </div>
              </SurveyField>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <SurveyField label={qLabel("totalPersons", "Total household members")}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateSurvey({ totalPersons: Math.max(0, (survey.totalPersons ?? 0) - 1) })
                  }
                  className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={survey.totalPersons ?? ""}
                  onChange={(e) => handleChangeNumber("totalPersons", e.target.value)}
                  className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateSurvey({ totalPersons: (survey.totalPersons ?? 0) + 1 })
                  }
                  className="h-11 w-11 rounded-2xl border border-border bg-background text-lg"
                >
                  +
                </button>
              </div>
            </SurveyField>
            <SurveyField label={qLabel("headName", "Head of household name")}>
              <input
                type="text"
                value={survey.headName}
                onChange={(e) => updateSurvey({ headName: e.target.value })}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Name of head"
              />
            </SurveyField>
            {renderChips(
              qLabel("headSex", "Sex of household head"),
              [
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ],
              survey.headSex,
              (value) => updateSurvey({ headSex: value as SurveyAnswers["headSex"] }),
            )}
            {renderChips(
              qLabel("category", "SC/ST/Other category"),
              [
                { label: "SC", value: "SC" },
                { label: "ST", value: "ST" },
                { label: "OBC", value: "OBC" },
                { label: "Other", value: "Other" },
              ],
              survey.category,
              (value) => updateSurvey({ category: value as SurveyAnswers["category"] }),
            )}
            {renderChips(
              qLabel("censusHouseOwnershipStatus", "Ownership status of census house"),
              [
                { label: "Lease", value: "Lease" },
                { label: "Other", value: "Other" },
                { label: "Owned", value: "Owned" },
                { label: "Rented", value: "Rented" },
              ],
              survey.censusHouseOwnershipStatus,
              (value) => updateSurvey({ censusHouseOwnershipStatus: value }),
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {renderSelect(
              qLabel("mainDrinkingSource", "Main drinking water source"),
              survey.mainDrinkingSource,
              (value) => updateSurvey({ mainDrinkingSource: value }),
              ["Borewell", "Other", "River / stream", "Tap / piped", "Tanker", "Well"],
              "Select water source",
            )}
            {renderChips(
              qLabel("drinkingWaterAvailable", "Availability of drinking water"),
              [
                { label: "No", value: "false" },
                { label: "Yes", value: "true" },
              ],
              survey.drinkingWaterAvailable ? "true" : "false",
              (value) => updateSurvey({ drinkingWaterAvailable: value === "true" }),
            )}
            {renderSelect(
              qLabel("mainLightingSource", "Main source of lighting"),
              survey.mainLightingSource,
              (value) => updateSurvey({ mainLightingSource: value }),
              ["Candles", "Electricity", "Kerosene", "Other", "Solar"],
              "Select lighting source",
            )}
            {renderChips(
              qLabel("accessToLatrine", "Access to latrine"),
              [
                { label: "No", value: "false" },
                { label: "Yes", value: "true" },
              ],
              survey.accessToLatrine ? "true" : "false",
              (value) => updateSurvey({ accessToLatrine: value === "true" }),
            )}
            {renderSelect(
              qLabel("latrineType", "Type of latrine"),
              survey.latrineType,
              (value) => updateSurvey({ latrineType: value }),
              ["Composting", "Flush", "None", "Pit", "Other"],
              "Select latrine type",
            )}
            {renderSelect(
              qLabel("wasteWaterOutlet", "Waste water outlet"),
              survey.wasteWaterOutlet,
              (value) => updateSurvey({ wasteWaterOutlet: value }),
              ["Drain", "Open ground", "Septic tank", "Soak pit", "Other"],
              "Select outlet",
            )}
            {renderSelect(
              qLabel("bathingFacility", "Bathing facility"),
              survey.bathingFacility,
              (value) => updateSurvey({ bathingFacility: value }),
              ["Bathroom", "None", "Open area", "Shared facility"],
              "Select bathing facility",
            )}
            {renderChips(
              qLabel("kitchenAvailability", "Kitchen and LPG/PNG availability"),
              [
                { label: "No", value: "false" },
                { label: "Yes", value: "true" },
              ],
              survey.kitchenAvailability ? "true" : "false",
              (value) => updateSurvey({ kitchenAvailability: value === "true" }),
            )}
            {renderChips(
              qLabel("cookingLocation", "Where do you cook food?"),
              [
                { label: "Dont cook food", value: "Dont cook food" },
                { label: "In the house not the kitchen", value: "In the house not the kitchen" },
                { label: "In the kitchen", value: "In the kitchen" },
                { label: "Outside", value: "Outside" },
              ],
              survey.cookingLocation,
              (value) => updateSurvey({ cookingLocation: value }),
            )}
            {renderSelect(
              qLabel("mainCookingFuel", "Main cooking fuel"),
              survey.mainCookingFuel,
              (value) => updateSurvey({ mainCookingFuel: value }),
              ["Coal", "Electric", "LPG/PNG", "Other", "Wood"],
              "Select cooking fuel",
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {([
                ["hasRadio", "Radio/Transistor"],
                ["hasTv", "Television"],
                ["hasInternet", "Internet access"],
                ["hasLaptop", "Laptop/Computer"],
                ["hasMobile", "Mobile phone/Smartphone"],
                ["hasBicycle", "Bicycle/Scooter/Motorcycle/Moped"],
                ["hasScooter", "Scooter"],
                ["hasCar", "Car/Jeep/Van"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSurvey({ [key]: !survey[key] } as Partial<SurveyAnswers>)}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm ${
                    survey[key]
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span className="block font-medium whitespace-normal break-words">{qLabel(String(key), label)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {survey[key] ? "Yes" : "No"}
                  </span>
                </button>
              ))}
            </div>
            {renderSelect(
              qLabel("mainCereal", "Main cereal consumed"),
              survey.mainCereal,
              (value) => updateSurvey({ mainCereal: value }),
              ["Maize", "Millet", "Other", "Pulses", "Rice", "Wheat"],
              "Select cereal",
            )}
            <SurveyField label={qLabel("mobileNumber", "Mobile number")}>
              <input
                type="tel"
                value={survey.mobileNumber}
                onChange={(e) => updateSurvey({ mobileNumber: e.target.value })}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Phone number"
              />
            </SurveyField>
            <SurveyField label={qLabel("notes", "Notes")}>
              <textarea
                value={survey.notes}
                onChange={(e) => updateSurvey({ notes: e.target.value })}
                className="w-full min-h-[112px] rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                placeholder="Any additional remarks"
              />
            </SurveyField>
          </div>
        );
    }
  };

  if (!marker) {
    return (
      <div className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Census Survey
            </p>
            <h1 className="text-lg font-bold">No house selected</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Select a house on the map to begin surveying.</p>
          <p className="text-xs text-muted-foreground mt-2">Tap any house from the map or households list and return here.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 pb-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              saveSurvey();
              onBack();
            }}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Census Survey</p>
            <h1 className="text-lg font-bold">{marker.houseNumber}</h1>
            <p className="text-xs text-muted-foreground mt-1">{marker.familyHeadName}</p>
          </div>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
          {syncLabel}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Step {step + 1}</p>
            <p className="text-sm font-semibold mt-1">{stepTitles[step]}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {step + 1} / {stepTitles.length}
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-secondary/50 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">House location</p>
            <p className="text-sm font-semibold mt-1">Lat {marker.lat.toFixed(5)}, Lng {marker.lng.toFixed(5)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              saveSurvey();
              onBack();
            }}
            className="rounded-2xl bg-secondary px-3.5 py-2 text-sm font-semibold"
          >
            View on map
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        {renderStepContent()}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 0}
            className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            {step === stepTitles.length - 1 ? "Finish survey" : "Next"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-2xl border border-destructive text-destructive px-4 py-3 text-sm font-semibold"
        >
          Delete household
        </button>
      </div>
    </div>
  );
}

function SurveyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {([true, false] as const).map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-2xl px-3 py-3 text-sm border ${
              value === option
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function HouseholdsScreen({ onOpenHouse }: { onOpenHouse: (uid: string) => void }) {
  const { markers, syncStatus, isSaving } = useNaksha();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "done" | "pending" | "ai">("all");
  const { position } = useGeolocation(false);
  const { place } = useReverseGeocode(position?.lat ?? null, position?.lng ?? null);

  type Tone = "success" | "warning" | "accent" | "muted";
  const toneBg: Record<Tone, string> = {
    success: "bg-success/15",
    warning: "bg-warning/15",
    accent: "bg-accent/15",
    muted: "bg-secondary",
  };
  const toneText: Record<Tone, string> = {
    success: "text-success",
    warning: "text-warning",
    accent: "text-accent",
    muted: "text-muted-foreground",
  };

  const rows = useMemo(() => {
    return markers
      .filter((m) => {
        if (tab === "done") return m.status === "done";
        if (tab === "pending") return m.status === "pending";
        if (tab === "ai") return m.status === "ai";
        return true;
      })
      .filter((m) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          m.houseNumber.toLowerCase().includes(q) ||
          m.familyHeadName.toLowerCase().includes(q) ||
          m.notes.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.seq - b.seq);
  }, [markers, tab, query]);

  const statusLabel = (m: HouseRecord) => {
    if (m.status === "done") return "Verified";
    if (m.status === "ai") return "AI suggestion";
    return "In progress";
  };
  const toneFor = (m: HouseRecord): Tone => {
    if (m.status === "done") return "success";
    if (m.status === "ai") return "accent";
    if (m.familyHeadName === "Unnamed household") return "muted";
    return "warning";
  };

  const counts = {
    all: markers.length,
    done: markers.filter((m) => m.status === "done").length,
    pending: markers.filter((m) => m.status === "pending").length,
    ai: markers.filter((m) => m.status === "ai").length,
  };

  return (
    <div className="pb-6">
      <div className="px-5 pt-2 pb-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Households
          </p>
          <h1 className="text-2xl font-bold leading-tight">{place?.city ?? "House list"}</h1>
        </div>
        <div className="h-10 px-3 rounded-full bg-secondary flex items-center gap-1.5 text-xs font-semibold">
          <div className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <span className="text-[12px]">🟡</span>
                  <span className="text-[11px]">Saving</span>
                </>
              ) : syncStatus === "online" ? (
                <>
                  <span className="text-[12px]">🟢</span>
                  <span className="text-[11px]">Online</span>
                </>
              ) : (
                <>
                  <span className="text-[12px]">🔴</span>
                  <span className="text-[11px]">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 rounded-2xl bg-card border border-border px-3.5 py-3 flex items-center gap-2 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, name…"
          className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="px-5 mt-4 flex gap-2 text-xs font-semibold overflow-x-auto">
        {(
          [
            ["all", `All ${counts.all}`],
            ["done", `Verified ${counts.done}`],
            ["pending", `Pending ${counts.pending}`],
            ["ai", `AI ${counts.ai}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap ${
              tab === id ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 px-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No households yet. Tap the map to add houses.
          </p>
        ) : (
          rows.map((h) => {
            const tone = toneFor(h);
            return (
              <button
                key={h.uid}
                type="button"
                onClick={() => onOpenHouse(h.uid)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition text-left"
              >
                <div className={`h-11 w-11 rounded-xl ${toneBg[tone]} flex items-center justify-center shrink-0`}>
                  <Home className={`h-5 w-5 ${toneText[tone]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{h.familyHeadName}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">{h.houseNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    {h.notes ? <span className="truncate max-w-[180px]">{h.notes}</span> : null}
                    <span className={toneText[tone]}>{statusLabel(h)}</span>
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function DashboardScreen() {
  const { markers } = useNaksha();
  const { position } = useGeolocation(false);
  const { place } = useReverseGeocode(position?.lat ?? null, position?.lng ?? null);
  const total = markers.length;
  const verified = markers.filter((m) => m.status === "done").length;
  const pending = markers.filter((m) => m.status === "pending").length;
  const ai = markers.filter((m) => m.status === "ai").length;
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const vPct = total > 0 ? (verified / total) * 100 : 0;
  const pPct = total > 0 ? (pending / total) * 100 : 0;
  const aPct = total > 0 ? (ai / total) * 100 : 0;

  return (
    <div className="pb-6">
      <div className="px-5 pt-2 pb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Settlement overview
        </p>
        <h1 className="text-2xl font-bold leading-tight">
          {place?.district && place.district !== "—" ? place.district : "Census summary"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {total > 0 ? `Live · ${total} structures on map` : "Place houses on the map to begin"}
        </p>
      </div>

      <div className="mx-4 rounded-3xl bg-foreground text-background p-5 relative overflow-hidden shadow-elevated">
        <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-background/60 font-semibold">
                Coverage
              </p>
              <p className="text-5xl font-bold font-display mt-1">
                {pct}
                <span className="text-2xl text-background/60">%</span>
              </p>
            </div>
            <div className="text-right text-xs text-background/70">
              <p>
                {verified} of {total || "—"}
              </p>
              <p>households</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-background/15 overflow-hidden flex">
            <div className="bg-success h-full" style={{ width: `${vPct}%` }} />
            <div className="bg-warning h-full" style={{ width: `${pPct}%` }} />
            <div className="bg-accent h-full" style={{ width: `${aPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] mt-2 text-background/70">
            <span>Verified {verified}</span>
            <span>Pending {pending}</span>
            <span>AI {ai}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <DashCard icon={Users} value={String(total)} label="Structures" trend={`${verified} surveyed`} />
        <DashCard icon={Home} value={String(pending)} label="Pending" trend={`${ai} AI flagged`} />
        <DashCard icon={Droplet} value={total ? `${Math.round((verified / total) * 100)}%` : "—"} label="Survey rate" trend="From map data" />
        <DashCard icon={Zap} value={String(ai)} label="AI markers" trend="On map" />
      </div>

      <div className="mx-4 mt-4 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          Field alerts
        </p>
        {total === 0 ? (
          <AlertRow icon={AlertCircle} tone="warning" title="No data yet" sub="Add houses on the map to begin census" />
        ) : (
          <>
            <AlertRow
              icon={CheckCircle2}
              tone="success"
              title={`${verified} households verified`}
              sub={`${total} total on map · local storage`}
            />
            {pending > 0 ? (
              <AlertRow
                icon={AlertCircle}
                tone="warning"
                title={`${pending} surveys in progress`}
                sub="Open from Houses tab to complete"
              />
            ) : null}
            {ai > 0 ? (
              <AlertRow icon={Sparkles} tone="accent" title={`${ai} AI-tagged structures`} sub="Review on map" />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function DashCard({
  icon: Icon,
  value,
  label,
  trend,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-2xl font-bold font-display mt-2 leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className="text-[10px] text-foreground/60 mt-1.5 font-medium">{trend}</p>
    </div>
  );
}

function AlertRow({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: typeof CheckCircle2;
  tone: "success" | "warning" | "accent";
  title: string;
  sub: string;
}) {
  const bg = { success: "bg-success/15", warning: "bg-warning/15", accent: "bg-accent/15" }[tone];
  const tx = { success: "text-success", warning: "text-warning", accent: "text-accent" }[tone];
  return (
    <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3 shadow-soft">
      <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${tx}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function BottomNav({
  screen,
  setScreen,
  onSurveyTap,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  onSurveyTap: () => void;
}) {
  const items: { id: Screen; icon: typeof MapPin; label: string }[] = [
    { id: "map", icon: MapPin, label: "Map" },
    { id: "households", icon: Home, label: "Houses" },
    { id: "survey", icon: ClipboardList, label: "Survey" },
    { id: "dashboard", icon: BarChart3, label: "Stats" },
  ];

  return (
    <div className="absolute bottom-0 inset-x-0 h-[72px] bg-background/95 backdrop-blur-xl border-t border-border/60 flex items-center justify-around px-2 pb-2">
      {items.map((it, idx) => {
        const active = screen === it.id;
        const isCenter = idx === 2;
        if (isCenter) {
          return (
            <button
              key={it.id}
              type="button"
              onClick={onSurveyTap}
              className="-mt-8 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-elevated flex items-center justify-center rotate-45"
            >
              <Plus className="h-6 w-6 -rotate-45" strokeWidth={2.5} />
            </button>
          );
        }
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setScreen(it.id)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1.5"
          >
            <it.icon
              className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
