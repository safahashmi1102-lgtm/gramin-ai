export type MarkerStatus = "done" | "pending" | "ai";

/** sequential = placement order · snake = geographic sweep · manual = enumerator-defined order */
export type NumberingMode = "sequential" | "snake" | "manual";

export type SurveyAnswers = {
  // STEP 1 — Identification
  buildingNumber: string;
  censusHouseNumber: string;
  householdNumber: string;
  useOfCensusHouse: string;

  // STEP 2 — Building details
  floorMaterial: string;
  wallMaterial: string;
  roofMaterial: string;
  condition: string;
  ownership: string;
  dwellingRooms: number | null;
  marriedCouples: number | null;
  censusHouseOwnershipStatus: string;

  // STEP 3 — Household details
  totalPersons: number | null;
  headName: string;
  headSex: "male" | "female" | "other" | "";
  category: "SC" | "ST" | "OBC" | "Other" | "";

  // STEP 4 — Water & sanitation
  mainDrinkingSource: string;
  drinkingWaterAvailable: boolean;
  mainLightingSource: string;
  accessToLatrine: boolean;
  latrineType: string;
  wasteWaterOutlet: string;
  bathingFacility: string;
  kitchenAvailability: boolean;
  lpgAvailable: boolean;
  cookingLocation: string;
  mainCookingFuel: string;

  // STEP 5 — Assets & connectivity (yes/no)
  hasRadio: boolean;
  hasTv: boolean;
  hasInternet: boolean;
  hasLaptop: boolean;
  hasMobile: boolean;
  hasBicycle: boolean;
  hasScooter: boolean;
  hasCar: boolean;
  hasDisability: boolean;
  vacantHouse: boolean;

  // STEP 6 — Final
  mainCereal: string;
  mobileNumber: string;
  notes: string;
};

export const defaultSurvey = (): SurveyAnswers => ({
  buildingNumber: "",
  censusHouseNumber: "",
  householdNumber: "",
  useOfCensusHouse: "",

  floorMaterial: "",
  wallMaterial: "",
  roofMaterial: "",
  condition: "",
  ownership: "",
  dwellingRooms: null,
  marriedCouples: null,
  censusHouseOwnershipStatus: "",

  totalPersons: null,
  headName: "",
  headSex: "",
  category: "",

  mainDrinkingSource: "",
  drinkingWaterAvailable: false,
  mainLightingSource: "",
  accessToLatrine: false,
  latrineType: "",
  wasteWaterOutlet: "",
  bathingFacility: "",
  kitchenAvailability: false,
  lpgAvailable: false,
  cookingLocation: "",
  mainCookingFuel: "",

  hasRadio: false,
  hasTv: false,
  hasInternet: false,
  hasLaptop: false,
  hasMobile: false,
  hasBicycle: false,
  hasScooter: false,
  hasCar: false,
  hasDisability: false,
  vacantHouse: false,

  mainCereal: "",
  mobileNumber: "",
  notes: "",
});

export type PlacementSource = "gps" | "manual";

export type HouseRecord = {
  uid: string;
  houseNumber: string;
  seq: number;
  lat: number;
  lng: number;
  familyHeadName: string;
  notes: string;
  floorNumber: string;
  flatNumber: string;
  placementSource: PlacementSource;
  status: MarkerStatus;
  survey: SurveyAnswers;
  photoId: string | null;
  gpsAccuracy: number | null;
  createdAt: number;
  updatedAt: number;
};

export type HouseFormData = {
  familyHeadName: string;
  notes: string;
  floorNumber: string;
  flatNumber: string;
  status: MarkerStatus;
  survey: SurveyAnswers;
  photoId: string | null;
  photoDataUrl?: string | null;
};

export type MapLayer = "street" | "satellite";

export type HistoryAction =
  | { type: "add"; marker: HouseRecord }
  | { type: "delete"; marker: HouseRecord }
  | { type: "update"; before: HouseRecord; after: HouseRecord };

export type NakshaPersistedState = {
  markers: HouseRecord[];
  numberingMode: NumberingMode;
  seqCounter: number;
  denseSettlement: boolean;
  followGps: boolean;
  mapLayer: MapLayer;
  /** UID order for manual numbering (snake/lane order set by enumerator) */
  manualOrderUids: string[];
};

export type GpsPosition = {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  timestamp: number;
};

export const DEFAULT_CENTER = { lat: 17.421, lng: 78.337 } as const;
export const STORAGE_KEY = "naksha_ai_v1";
