import { Battery, Signal, Wifi } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function PhoneStatusBar() {
  return (
    <View style={styles.bar}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.icons}>
        <Signal size={14} color={colors.foreground} />
        <Wifi size={14} color={colors.foreground} />
        <Battery size={16} color={colors.foreground} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  icons: { flexDirection: "row", alignItems: "center", gap: 6 },
});
