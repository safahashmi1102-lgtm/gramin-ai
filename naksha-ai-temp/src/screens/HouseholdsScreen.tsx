import { ChevronRight, Home, Search, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMarkers } from "../context/MarkersContext";
import { colors, shadows } from "../theme/colors";

type Tone = "success" | "warning" | "accent" | "muted";

const toneBg: Record<Tone, string> = {
  success: "#4A9D6E26",
  warning: "#E8B84A26",
  accent: "#D4844A26",
  muted: colors.secondary,
};

const toneText: Record<Tone, string> = {
  success: colors.success,
  warning: colors.warning,
  accent: colors.accent,
  muted: colors.mutedForeground,
};

const demoHouses: { id: string; name: string; members: number; status: string; tone: Tone }[] = [
  { id: "H-012", name: "Lakshmi Devi", members: 4, status: "Verified", tone: "success" },
  { id: "H-013", name: "Suresh Yadav", members: 7, status: "Verified", tone: "success" },
  { id: "H-014", name: "Anjali Patil", members: 3, status: "Verified", tone: "success" },
  { id: "H-015", name: "Ramesh Kumar", members: 6, status: "In progress", tone: "warning" },
];

export function HouseholdsScreen() {
  const { markers } = useMarkers();

  const placed = markers.map((m) => ({
    id: m.id,
    name: "New placement",
    members: 0,
    status: m.status === "pending" ? "Placed on map" : m.status === "done" ? "Verified" : "AI suggestion",
    tone: (m.status === "done" ? "success" : m.status === "pending" ? "warning" : "accent") as Tone,
  }));

  const houses = [...placed.reverse(), ...demoHouses.filter((d) => !placed.some((p) => p.id === d.id))];
  const total = houses.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Households</Text>
          <Text style={styles.title}>Kanthapur</Text>
        </View>
       
      </View>

      <View style={styles.search}>
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          placeholder="Search by ID, name…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabs}>
        {[`All ${total}`, "Verified 89", "Pending 41", "AI 12"].map((t, i) => (
          <Pressable key={t} style={[styles.tab, i === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, i === 0 && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {houses.map((h) => (
          <Pressable key={h.id} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: toneBg[h.tone] }]}>
              <Home size={20} color={toneText[h.tone]} />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTitle}>
                <Text style={styles.name} numberOfLines={1}>
                  {h.name}
                </Text>
                <Text style={styles.hid}>{h.id}</Text>
              </View>
              <View style={styles.rowSub}>
                {h.members > 0 ? (
                  <View style={styles.membersRow}>
                    <Users size={12} color={colors.mutedForeground} />
                    <Text style={styles.rowSubText}> {h.members} members · </Text>
                  </View>
                ) : null}
                <Text style={[styles.rowSubText, { color: toneText[h.tone] }]}>{h.status}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.98,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground, letterSpacing: -0.48 },
 
  
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground },
  tabs: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  tabActive: { backgroundColor: colors.foreground },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.secondaryForeground },
  tabTextActive: { color: colors.background },
  list: { marginTop: 16, paddingHorizontal: 12, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 },
  hid: { fontSize: 10, fontFamily: "monospace", color: colors.mutedForeground },
  rowSub: { flexDirection: "row", alignItems: "center", marginTop: 2, flexWrap: "wrap" },
  membersRow: { flexDirection: "row", alignItems: "center" },
  rowSubText: { fontSize: 12, color: colors.mutedForeground },
});
