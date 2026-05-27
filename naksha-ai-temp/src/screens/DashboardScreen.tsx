import {
  AlertCircle,
  CheckCircle2,
  Droplet,
  Home,
  Sparkles,
  Users,
  Zap,
} from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AlertRow, DashCard } from "../components/Shared";
import { useMarkers } from "../context/MarkersContext";
import { colors, shadows } from "../theme/colors";

export function DashboardScreen() {
  const { markers } = useMarkers();
  const total = 142;
  const placed = markers.length;
  const pct = Math.min(100, Math.round((89 / total) * 100));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Settlement overview</Text>
        <Text style={styles.title}>Kanthapur Census</Text>
        <Text style={styles.sub}>Updated 4 min ago · synced · {placed} on map</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Coverage</Text>
              <Text style={styles.heroPct}>
                {pct}
                <Text style={styles.heroPctSmall}>%</Text>
              </Text>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroRightText}>89 of {total}</Text>
              <Text style={styles.heroRightText}>households</Text>
            </View>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barSeg, { flex: 62, backgroundColor: colors.success }]} />
            <View style={[styles.barSeg, { flex: 29, backgroundColor: colors.warning }]} />
            <View style={[styles.barSeg, { flex: 9, backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>Verified 89</Text>
            <Text style={styles.barLabel}>Pending 41</Text>
            <Text style={styles.barLabel}>AI 12</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <DashCard icon={Users} value="612" label="Population" trend="+8 today" />
        <DashCard icon={Home} value={String(total)} label="Structures" trend={`${placed} placed`} />
        <DashCard icon={Droplet} value="74%" label="Water access" trend="105 households" />
        <DashCard icon={Zap} value="91%" label="Electricity" trend="129 households" />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text style={styles.chartTitle}>Age distribution</Text>
          <Text style={styles.chartLive}>live</Text>
        </View>
        <View style={styles.bars}>
          {[40, 65, 78, 92, 70, 55, 38, 24].map((h, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.barFill, { height: `${h}%` }]} />
            </View>
          ))}
        </View>
        <View style={styles.ageLabels}>
          {["0-5", "6-12", "13-18", "19-30", "31-45", "46-60", "61-75", "75+"].map((l) => (
            <Text key={l} style={styles.ageLabel}>
              {l}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.alerts}>
        <Text style={styles.alertsTitle}>Field alerts</Text>
        <AlertRow icon={CheckCircle2} tone="success" title="Sector A complete" sub="Submitted 14 surveys" />
        <AlertRow icon={Sparkles} tone="accent" title="AI found 2 structures" sub="Near river bend, north-east" />
        <AlertRow icon={AlertCircle} tone="warning" title="3 surveys need review" sub="Conflicting GPS coordinates" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.98,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground, letterSpacing: -0.48 },
  sub: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  hero: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.foreground,
    padding: 20,
    overflow: "hidden",
    ...shadows.elevated,
  },
  heroGlow: {
    position: "absolute",
    right: -48,
    bottom: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(61, 122, 92, 0.4)",
  },
  heroInner: { position: "relative" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: "rgba(250, 249, 246, 0.6)",
    fontWeight: "600",
  },
  heroPct: { fontSize: 48, fontWeight: "700", color: colors.background, marginTop: 4 },
  heroPctSmall: { fontSize: 24, color: "rgba(250, 249, 246, 0.6)" },
  heroRight: { alignItems: "flex-end" },
  heroRightText: { fontSize: 12, color: "rgba(250, 249, 246, 0.7)" },
  bar: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(250, 249, 246, 0.15)",
  },
  barSeg: { height: "100%" },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  barLabel: { fontSize: 10, color: "rgba(250, 249, 246, 0.7)" },
  grid: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.soft,
  },
  chartHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  chartLive: { fontSize: 10, color: colors.mutedForeground },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 96 },
  barCol: { flex: 1, height: "100%", justifyContent: "flex-end" },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  ageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ageLabel: { fontSize: 9, fontWeight: "500", color: colors.mutedForeground },
  alerts: { marginHorizontal: 16, marginTop: 16, gap: 8 },
  alertsTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.mutedForeground,
    fontWeight: "600",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
});
