import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";
import { colors, shadows } from "../theme/colors";

const SLIDE_TITLES = [
  "House identification",
  "Building materials",
  "Household details",
  "Water, sanitation & utilities",
  "Assets & final details",
] as const;

type SurveyDraft = {
  buildingNumber: string;
  censusHouseNumber: string;
  householdNumber: string;
  censusUse: string;
  houseCondition: string;
  floorMaterial: string;
  wallMaterial: string;
  roofMaterial: string;
  totalPersons: string;
  householdHeadName: string;
  householdHeadSex: string;
  category: string;
  ownershipStatus: string;
  dwellingRooms: string;
  marriedCouples: string;
  drinkingWaterSource: string;
  drinkingWaterAvailable: string;
  lightingSource: string;
  latrineAccess: string;
  latrineType: string;
  wasteWaterOutlet: string;
  bathingFacility: string;
  kitchenLpg: string;
  cookingFuel: string;
  radio: boolean;
  television: boolean;
  internet: boolean;
  computer: boolean;
  mobilePhone: boolean;
  bicycle: boolean;
  scooter: boolean;
  car: boolean;
  mainCereal: string;
  mobileNumber: string;
  notes: string;
};

const defaultSurvey: SurveyDraft = {
  buildingNumber: "",
  censusHouseNumber: "",
  householdNumber: "",
  censusUse: "",
  houseCondition: "",
  floorMaterial: "",
  wallMaterial: "",
  roofMaterial: "",
  totalPersons: "",
  householdHeadName: "",
  householdHeadSex: "",
  category: "",
  ownershipStatus: "",
  dwellingRooms: "",
  marriedCouples: "",
  drinkingWaterSource: "",
  drinkingWaterAvailable: "",
  lightingSource: "",
  latrineAccess: "",
  latrineType: "",
  wasteWaterOutlet: "",
  bathingFacility: "",
  kitchenLpg: "",
  cookingFuel: "",
  radio: false,
  television: false,
  internet: false,
  computer: false,
  mobilePhone: false,
  bicycle: false,
  scooter: false,
  car: false,
  mainCereal: "",
  mobileNumber: "",
  notes: "",
};

type PickerState = {
  visible: boolean;
  field: keyof SurveyDraft | null;
  title: string;
  options: string[];
};

const censusUseOptions = [
  "Residence",
  "Residence + work",
  "Shop/office",
  "School/college",
  "Hotel/guest house",
  "Hospital/dispensary",
  "Factory/workshop",
  "Place of worship",
  "Other non-residential",
  "Vacant",
];

const conditionOptions = ["Good", "Livable", "Dilapidated"];

const floorOptions = ["Mud", "Wood/Bamboo", "Burnt brick", "Stone", "Cement", "Mosaic/Tiles", "Other"];
const wallOptions = [
  "Grass/Thatch/Bamboo",
  "Plastic/Polythene",
  "Mud/Unburnt brick",
  "Wood",
  "Stone without mortar",
  "Stone with mortar",
  "GI/Metal/Asbestos sheets",
  "Burnt brick",
  "Concrete",
  "Other",
];
const roofOptions = [
  "Grass/Thatch/Bamboo/Wood/Mud",
  "Plastic/Polythene",
  "Handmade tiles",
  "Machine-made tiles",
  "Burnt brick",
  "Stone",
  "Slate",
  "GI/Metal/Asbestos sheets",
  "Concrete",
  "Other",
];

const sexOptions = ["Male", "Female", "Transgender"];
const categoryOptions = ["SC", "ST", "Other"];
const ownershipOptions = ["Owned", "Rented but owns another house", "Rented and owns no house", "Other"];

const waterSourceOptions = [
  "Treated tap water",
  "Untreated tap water",
  "Well",
  "Hand pump",
  "Tubewell/Borehole",
  "Spring",
  "River/Canal",
  "Pond/Lake",
  "Bottled water",
  "Other",
];

const lightingOptions = ["Electricity", "Kerosene", "Solar", "Other oil", "Other", "No lighting"];
const cookingFuelOptions = [
  "Firewood",
  "Crop residue",
  "Cowdung cake",
  "Coal/Lignite/Charcoal",
  "Kerosene",
  "LPG/PNG",
  "Electricity",
  "Bio-gas",
  "Solar",
  "Other",
];

const cerealOptions = ["Rice", "Wheat", "Jowar", "Bajra", "Maize", "Other"];
const latrineTypeOptions = ["No latrine", "Pit latrine", "Flush/septic", "Composting", "Other"];
const wasteOutletOptions = ["Open drain", "Closed drain", "Septic tank", "Soak pit", "Other"];
const bathingOptions = ["Own bathroom", "Shared bathroom", "No facility", "Other"];

const boolOptions = ["Yes", "No"];

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function TextField({
  label,
  value,
  placeholder,
  keyboardType,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <SectionLabel label={label} />
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChange}
      />
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: T[];
  value: string;
  onSelect: (value: T) => void;
}) {
  return (
    <View>
      <SectionLabel label={label} />
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PickerField({
  label,
  value,
  onOpen,
}: {
  label: string;
  value: string;
  onOpen: () => void;
}) {
  return (
    <View>
      <SectionLabel label={label} />
      <Pressable style={styles.selectField} onPress={onOpen}>
        <Text style={[styles.selectValue, !value && styles.placeholderText]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

function OptionSheet({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onClose: () => void;
  onSelect: (option: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable
                key={option}
                style={styles.sheetOption}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.sheetOptionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

export function SurveyScreen({
  onBack,
  houseId = "H-015",
}: {
  onBack: () => void;
  houseId?: string;
}) {
  const storageKey = `@naksha_ai/survey:${houseId}`;
  const [slideIndex, setSlideIndex] = useState(0);
  const [survey, setSurvey] = useState<SurveyDraft>(defaultSurvey);
  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    field: null,
    title: "",
    options: [],
  });
  const [syncStatus, setSyncStatus] = useState("Draft loading…");
  const [dirty, setDirty] = useState(false);

  const saveDraft = useCallback(
    async (nextSurvey: SurveyDraft) => {
      setSyncStatus("Saving…");
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextSurvey));
      setSyncStatus("Saved");
      setDirty(false);
    },
    [storageKey],
  );

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        try {
          setSurvey(JSON.parse(raw));
          setSyncStatus("Draft restored");
        } catch {
          setSurvey(defaultSurvey);
          setSyncStatus("Ready");
        }
      } else {
        setSyncStatus("Ready");
      }
    })();
  }, [storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void saveDraft(survey);
    }, 450);
    return () => clearTimeout(timer);
  }, [dirty, saveDraft, survey]);

  const setField = useCallback(
    <K extends keyof SurveyDraft>(field: K, value: SurveyDraft[K]) => {
      setSurvey((prev) => ({ ...prev, [field]: value }));
      setDirty(true);
    },
    [],
  );

  const openPicker = useCallback((field: keyof SurveyDraft, title: string, options: string[]) => {
    setPicker({ visible: true, field, title, options });
  }, []);

  const handleSelect = useCallback(
    (option: string) => {
      if (!picker.field) return;
      setField(picker.field, option as SurveyDraft[typeof picker.field]);
    },
    [picker.field, setField],
  );

  const handleClear = useCallback(() => {
    Alert.alert("Delete survey", "Delete saved answers for this house?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(storageKey);
          setSurvey(defaultSurvey);
          setSlideIndex(0);
          setSyncStatus("Draft deleted");
          setDirty(false);
        },
      },
    ]);
  }, [storageKey]);

  const onNext = useCallback(() => {
    if (slideIndex < SLIDE_TITLES.length - 1) {
      setSlideIndex((current) => current + 1);
    } else {
      void saveDraft(survey);
      setSyncStatus("Final save complete");
    }
  }, [saveDraft, slideIndex, survey]);

  const onPrevious = useCallback(() => {
    setSlideIndex((current) => Math.max(0, current - 1));
  }, []);

  const currentLabel = SLIDE_TITLES[slideIndex];
  const progress = `${slideIndex + 1} / ${SLIDE_TITLES.length}`;
  const progressWidth = (slideIndex + 1) / SLIDE_TITLES.length;

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.stepEyebrow}>House {houseId}</Text>
            <Text style={styles.stepTitle}>{currentLabel}</Text>
          </View>
          <Pressable onPress={handleClear} style={styles.deleteBtn}>
            <Trash2 size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressCaption}>{progress}</Text>
            <Text style={styles.syncText}>{syncStatus}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: progressWidth }]} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.pageTitle}>{currentLabel}</Text>
          <Text style={styles.pageSubtitle}>Complete this slide before moving on.</Text>

          {slideIndex === 0 ? (
            <View style={styles.slideContent}>
              <TextField
                label="Building number"
                value={survey.buildingNumber}
                onChange={(value) => setField("buildingNumber", value)}
              />
              <TextField
                label="Census house number"
                value={survey.censusHouseNumber}
                onChange={(value) => setField("censusHouseNumber", value)}
              />
              <TextField
                label="Household number"
                value={survey.householdNumber}
                keyboardType="numeric"
                onChange={(value) => setField("householdNumber", value)}
              />
              <PickerField
                label="Use of census house"
                value={survey.censusUse}
                onOpen={() => openPicker("censusUse", "Use of census house", censusUseOptions)}
              />
              <ChipGroup
                label="Condition of census house"
                options={conditionOptions}
                value={survey.houseCondition}
                onSelect={(value) => setField("houseCondition", value)}
              />
            </View>
          ) : slideIndex === 1 ? (
            <View style={styles.slideContent}>
              <PickerField
                label="Predominant floor material"
                value={survey.floorMaterial}
                onOpen={() => openPicker("floorMaterial", "Predominant floor material", floorOptions)}
              />
              <PickerField
                label="Predominant wall material"
                value={survey.wallMaterial}
                onOpen={() => openPicker("wallMaterial", "Predominant wall material", wallOptions)}
              />
              <PickerField
                label="Predominant roof material"
                value={survey.roofMaterial}
                onOpen={() => openPicker("roofMaterial", "Predominant roof material", roofOptions)}
              />
            </View>
          ) : slideIndex === 2 ? (
            <View style={styles.slideContent}>
              <TextField
                label="Total persons residing"
                value={survey.totalPersons}
                keyboardType="numeric"
                onChange={(value) => setField("totalPersons", value)}
              />
              <TextField
                label="Name of household head"
                value={survey.householdHeadName}
                onChange={(value) => setField("householdHeadName", value)}
              />
              <ChipGroup
                label="Sex of household head"
                options={sexOptions}
                value={survey.householdHeadSex}
                onSelect={(value) => setField("householdHeadSex", value)}
              />
              <ChipGroup
                label="SC / ST / Other category"
                options={categoryOptions}
                value={survey.category}
                onSelect={(value) => setField("category", value)}
              />
              <ChipGroup
                label="Ownership status"
                options={ownershipOptions}
                value={survey.ownershipStatus}
                onSelect={(value) => setField("ownershipStatus", value)}
              />
              <View style={styles.rowFields}>
                <TextField
                  label="Dwelling rooms"
                  value={survey.dwellingRooms}
                  keyboardType="numeric"
                  onChange={(value) => setField("dwellingRooms", value)}
                />
                <TextField
                  label="Married couples"
                  value={survey.marriedCouples}
                  keyboardType="numeric"
                  onChange={(value) => setField("marriedCouples", value)}
                />
              </View>
            </View>
          ) : slideIndex === 3 ? (
            <View style={styles.slideContent}>
              <PickerField
                label="Main source of drinking water"
                value={survey.drinkingWaterSource}
                onOpen={() => openPicker("drinkingWaterSource", "Main source of drinking water", waterSourceOptions)}
              />
              <ChipGroup
                label="Availability of drinking water"
                options={boolOptions}
                value={survey.drinkingWaterAvailable}
                onSelect={(value) => setField("drinkingWaterAvailable", value)}
              />
              <PickerField
                label="Main source of lighting"
                value={survey.lightingSource}
                onOpen={() => openPicker("lightingSource", "Main source of lighting", lightingOptions)}
              />
              <ChipGroup
                label="Access to latrine"
                options={boolOptions}
                value={survey.latrineAccess}
                onSelect={(value) => setField("latrineAccess", value)}
              />
              <PickerField
                label="Type of latrine"
                value={survey.latrineType}
                onOpen={() => openPicker("latrineType", "Type of latrine", latrineTypeOptions)}
              />
              <PickerField
                label="Waste water outlet"
                value={survey.wasteWaterOutlet}
                onOpen={() => openPicker("wasteWaterOutlet", "Waste water outlet", wasteOutletOptions)}
              />
              <PickerField
                label="Bathing facility"
                value={survey.bathingFacility}
                onOpen={() => openPicker("bathingFacility", "Bathing facility", bathingOptions)}
              />
              <ChipGroup
                label="Kitchen / LPG / PNG available"
                options={boolOptions}
                value={survey.kitchenLpg}
                onSelect={(value) => setField("kitchenLpg", value)}
              />
              <PickerField
                label="Main cooking fuel"
                value={survey.cookingFuel}
                onOpen={() => openPicker("cookingFuel", "Main cooking fuel", cookingFuelOptions)}
              />
            </View>
          ) : (
            <View style={styles.slideContent}>
              <View style={styles.assetGrid}>
                {(
                  [
                    ["Radio/Transistor", "radio"],
                    ["Television", "television"],
                    ["Internet access", "internet"],
                    ["Laptop/Computer", "computer"],
                    ["Mobile phone/Smartphone", "mobilePhone"],
                    ["Bicycle", "bicycle"],
                    ["Scooter/Motorcycle/Moped", "scooter"],
                    ["Car/Jeep/Van", "car"],
                  ] as const
                ).map(([label, field]) => {
                  const active = Boolean(survey[field]);
                  return (
                    <Pressable
                      key={field}
                      style={[styles.assetChip, active && styles.assetChipActive]}
                      onPress={() => setField(field, !active as SurveyDraft[typeof field])}
                    >
                      <Text style={[styles.assetText, active && styles.assetTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <PickerField
                label="Main cereal consumed"
                value={survey.mainCereal}
                onOpen={() => openPicker("mainCereal", "Main cereal consumed", cerealOptions)}
              />
              <TextField
                label="Mobile number"
                value={survey.mobileNumber}
                keyboardType="phone-pad"
                onChange={(value) => setField("mobileNumber", value)}
              />
              <View>
                <SectionLabel label="Notes" />
                <TextInput
                  placeholder="Add observations or details"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, styles.textArea]}
                  value={survey.notes}
                  onChangeText={(value) => setField("notes", value)}
                  multiline
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onPrevious}
          style={[styles.navBtn, slideIndex === 0 && styles.navBtnDisabled]}
          disabled={slideIndex === 0}
        >
          <ChevronLeft size={18} color={slideIndex === 0 ? colors.mutedForeground : colors.foreground} />
          <Text style={[styles.navText, slideIndex === 0 && styles.navTextDisabled]}>Previous</Text>
        </Pressable>
        <Pressable onPress={onNext} style={styles.saveBtn}>
          <Text style={styles.saveText}>{slideIndex === SLIDE_TITLES.length - 1 ? "Save survey" : "Next slide"}</Text>
          <ChevronRight size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <OptionSheet
        visible={picker.visible}
        title={picker.title}
        options={picker.options}
        onClose={() => setPicker((prev) => ({ ...prev, visible: false }))}
        onSelect={handleSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  top: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  stepEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  stepTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 4, textAlign: "center" },
  progressWrap: { paddingHorizontal: 20, marginBottom: 16 },
  progressTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressCaption: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  syncText: { fontSize: 11, color: colors.mutedForeground },
  progressTrack: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  sectionCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: colors.mutedForeground, marginBottom: 16 },
  slideContent: { gap: 16 },
  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.mutedForeground,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    color: colors.foreground,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, color: colors.foreground, fontWeight: "600" },
  chipTextActive: { color: colors.primaryForeground },
  selectField: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: { fontSize: 14, color: colors.foreground },
  placeholderText: { color: colors.mutedForeground },
  rowFields: { flexDirection: "row", gap: 12 },
  assetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  assetChip: {
    minWidth: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  assetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assetText: { fontSize: 13, color: colors.foreground, fontWeight: "600" },
  assetTextActive: { color: colors.primaryForeground },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    paddingVertical: 14,
  },
  navBtnDisabled: { opacity: 0.45 },
  navText: { fontSize: 14, color: colors.foreground, fontWeight: "700" },
  navTextDisabled: { color: colors.mutedForeground },
  saveBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    ...shadows.elevated,
  },
  saveText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "700" },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
  sheetList: { gap: 8 },
  sheetOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetOptionText: { fontSize: 15, color: colors.foreground },
});
