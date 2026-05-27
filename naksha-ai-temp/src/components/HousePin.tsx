import { Home } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import type { MarkerStatus } from "../storage/markers";

const statusColor: Record<MarkerStatus, string> = {
  done: colors.success,
  pending: colors.warning,
  ai: colors.accent,
};

export function HousePin({ id, status }: { id: string; status: MarkerStatus }) {
  const bg = statusColor[status];
  return (
    <View style={styles.wrap}>
      <View style={[styles.pin, { backgroundColor: bg }]}>
        <Home size={12} color={colors.card} strokeWidth={2.5} style={styles.icon} />
      </View>
      <Text style={styles.label}>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
    ...{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 4,
    },
  },
  icon: { transform: [{ rotate: "-45deg" }] },
  label: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(61, 52, 41, 0.8)",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});
