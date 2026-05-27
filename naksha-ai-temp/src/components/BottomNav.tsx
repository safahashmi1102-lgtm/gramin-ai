import {
  BarChart3,
  ClipboardList,
  Home,
  MapPin,
  Plus,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type Screen = "map" | "survey" | "households" | "dashboard";

const items: { id: Screen; icon: typeof MapPin; label: string }[] = [
  { id: "map", icon: MapPin, label: "Map" },
  { id: "households", icon: Home, label: "Houses" },
  { id: "survey", icon: ClipboardList, label: "Survey" },
  { id: "dashboard", icon: BarChart3, label: "Stats" },
];

export function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  return (
    <View style={styles.bar}>
      {items.map((it, idx) => {
        const active = screen === it.id;
        const isCenter = idx === 2;
        const Icon = it.icon;
        if (isCenter) {
          return (
            <Pressable
              key={it.id}
              onPress={() => setScreen(it.id)}
              style={styles.fab}
            >
              <Plus size={24} color={colors.primaryForeground} strokeWidth={2.5} style={styles.fabIcon} />
            </Pressable>
          );
        }
        return (
          <Pressable key={it.id} onPress={() => setScreen(it.id)} style={styles.item}>
            <Icon
              size={20}
              color={active ? colors.primary : colors.mutedForeground}
              strokeWidth={active ? 2.4 : 2}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 226, 218, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 6, gap: 2 },
  label: { fontSize: 10, fontWeight: "600", color: colors.mutedForeground },
  labelActive: { color: colors.primary },
  fab: {
    marginTop: -32,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  fabIcon: { transform: [{ rotate: "-45deg" }] },
});
