import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../theme/colors";

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MapBtn({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.mapBtn}>
      {children}
    </Pressable>
  );
}

export function Field({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text style={styles.fieldValue}>{value}</Text>
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function AmenityChip({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <Pressable
      style={[styles.amenity, active && styles.amenityActive]}
    >
      <Icon size={16} color={active ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.amenityText, active && styles.amenityTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function DashCard({
  icon: Icon,
  value,
  label,
  trend,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  trend: string;
}) {
  return (
    <View style={styles.dashCard}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.dashValue}>{value}</Text>
      <Text style={styles.dashLabel}>{label}</Text>
      <Text style={styles.dashTrend}>{trend}</Text>
    </View>
  );
}

export function AlertRow({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: LucideIcon;
  tone: "success" | "warning" | "accent";
  title: string;
  sub: string;
}) {
  const bg = { success: "#4A9D6E26", warning: "#E8B84A26", accent: "#D4844A26" }[tone];
  const tx = { success: colors.success, warning: colors.warning, accent: colors.accent }[tone];
  return (
    <View style={styles.alertRow}>
      <View style={[styles.alertIcon, { backgroundColor: bg }]}>
        <Icon size={16} color={tx} />
      </View>
      <View style={styles.alertText}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSub}>{sub}</Text>
      </View>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.48,
  },
  screenEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.98,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  headerPad: { paddingHorizontal: 20, paddingTop: 8 },
});

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    ...shadows.soft,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 226, 218, 0.5)",
    ...shadows.soft,
  },
  fieldLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.mutedForeground,
    fontWeight: "600",
    marginBottom: 6,
  },
  fieldBox: {
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    ...shadows.soft,
  },
  fieldValue: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  fieldSuffix: { fontSize: 12, color: colors.mutedForeground },
  amenity: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  amenityActive: {
    backgroundColor: "rgba(61, 122, 92, 0.1)",
    borderColor: "rgba(61, 122, 92, 0.4)",
  },
  amenityText: { fontSize: 12, fontWeight: "500", color: colors.mutedForeground },
  amenityTextActive: { color: colors.primary },
  dashCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.soft,
  },
  dashValue: { fontSize: 24, fontWeight: "700", color: colors.foreground, marginTop: 8 },
  dashLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  dashTrend: { fontSize: 10, color: "rgba(61, 52, 41, 0.6)", marginTop: 6, fontWeight: "500" },
  alertRow: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.soft,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  alertSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
});
