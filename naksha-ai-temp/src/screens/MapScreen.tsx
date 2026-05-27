import * as Location from "expo-location";
import {
  Compass,
  Layers,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, UrlTile, type MapPressEvent, type Region } from "react-native-maps";
import { HousePin } from "../components/HousePin";
import { MapBtn, Stat } from "../components/Shared";
import { useMarkers } from "../context/MarkersContext";
import { colors, shadows } from "../theme/colors";

const DEFAULT_REGION: Region = {
  latitude: 17.421,
  longitude: 78.337,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

const OSM_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { markers, addMarker, loading } = useMarkers();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [coordsLabel, setCoordsLabel] = useState("17.421°N, 78.337°E");
  const [locating, setLocating] = useState(true);

  const centerOnUser = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location", "Enable location permission to use GPS.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = pos.coords;
    const next: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    };
    setRegion(next);
    setCoordsLabel(
      `${Math.abs(latitude).toFixed(3)}°${latitude >= 0 ? "N" : "S"}, ${Math.abs(longitude).toFixed(3)}°${longitude >= 0 ? "E" : "W"}`,
    );
    mapRef.current?.animateToRegion(next, 600);
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const next: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
      setRegion(next);
      setCoordsLabel(
        `${Math.abs(latitude).toFixed(3)}°${latitude >= 0 ? "N" : "S"}, ${Math.abs(longitude).toFixed(3)}°${longitude >= 0 ? "E" : "W"}`,
      );
      setLocating(false);

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        (update) => {
          const { latitude: lat, longitude: lng } = update.coords;
          setCoordsLabel(
            `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? "E" : "W"}`,
          );
        },
      );
    })();
    return () => {
      sub?.remove();
    };
  }, []);

  const onMapPress = useCallback(
    async (e: MapPressEvent) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const created = await addMarker(latitude, longitude, "pending");
      Alert.alert("House placed", `${created.id} saved on device.`);
    },
    [addMarker],
  );

  const doneCount = markers.filter((m) => m.status === "done").length;
  const pendingCount = markers.filter((m) => m.status === "pending").length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Surveying</Text>
          <Text style={styles.title}>Kanthapur</Text>
          <Text style={styles.sub}>
            Block 04 · Sector A · {coordsLabel}
            {locating ? " · GPS…" : ""}
          </Text>
        </View>
        <Pressable style={styles.searchBtn}>
          <Search size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={onMapPress}
            showsUserLocation
            showsMyLocationButton={false}
            mapType="none"
            rotateEnabled
            pitchEnabled={false}
          >
            <UrlTile urlTemplate={OSM_TILE} maximumZ={19} flipY={false} />
            {markers.map((m) => (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
              >
                <HousePin id={m.id} status={m.status} />
              </Marker>
            ))}
          </MapView>
        )}

        <View style={styles.controls} pointerEvents="box-none">
          <MapBtn>
            <Layers size={16} color={colors.foreground} />
          </MapBtn>
          <MapBtn>
            <Compass size={16} color={colors.foreground} />
          </MapBtn>
          <MapBtn onPress={centerOnUser}>
            <Navigation size={16} color={colors.primary} />
          </MapBtn>
        </View>

        <View style={styles.legend} pointerEvents="none">
          <Text style={styles.legendItem}>
            <Text style={[styles.dot, { backgroundColor: colors.success }]} /> Surveyed
          </Text>
          <Text style={styles.legendItem}>
            <Text style={[styles.dot, { backgroundColor: colors.warning }]} /> Pending
          </Text>
          <Text style={styles.legendItem}>
            <Text style={[styles.dot, { backgroundColor: colors.accent }]} /> AI
          </Text>
        </View>

        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>Tap map to place house · H-001, H-002…</Text>
        </View>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.aiGlow} />
        <View style={styles.aiRow}>
          <View style={styles.aiIcon}>
            <Sparkles size={16} color={colors.accentForeground} />
          </View>
          <View style={styles.aiBody}>
            <View style={styles.aiHead}>
              <Text style={styles.aiEyebrow}>AI Detected</Text>
              <Text style={styles.aiBadge}>2 new</Text>
            </View>
            <Text style={styles.aiText}>
              Satellite imagery suggests 2 unmapped structures 40m north‑east.
            </Text>
            <View style={styles.aiActions}>
              <Pressable style={styles.aiPrimary}>
                <Text style={styles.aiPrimaryText}>Add to route</Text>
              </Pressable>
              <Pressable>
                <Text style={styles.aiDismiss}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Done today" value={String(doneCount).padStart(2, "0")} />
        <Stat label="Placed" value={String(pendingCount).padStart(2, "0")} />
        <Stat label="Total" value={String(markers.length).padStart(2, "0")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 8 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.98,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.48,
    marginTop: 2,
  },
  sub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapWrap: {
    marginHorizontal: 16,
    height: 420,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.topo,
    borderWidth: 1,
    borderColor: "rgba(229, 226, 218, 0.6)",
    ...shadows.soft,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  controls: {
    position: "absolute",
    top: 12,
    right: 12,
    gap: 8,
  },
  legend: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 12,
    ...shadows.soft,
  },
  legendItem: { fontSize: 10, fontWeight: "500", color: colors.foreground },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  hint: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  hintText: { fontSize: 10, fontWeight: "600", color: colors.mutedForeground },
  aiCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.foreground,
    padding: 16,
    overflow: "hidden",
    ...shadows.elevated,
  },
  aiGlow: {
    position: "absolute",
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(212, 132, 74, 0.3)",
  },
  aiRow: { flexDirection: "row", gap: 12 },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBody: { flex: 1 },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: "rgba(250, 249, 246, 0.6)",
    fontWeight: "600",
  },
  aiBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(212, 132, 74, 0.2)",
    color: colors.accent,
    overflow: "hidden",
  },
  aiText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.background,
    marginTop: 4,
    lineHeight: 20,
  },
  aiActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  aiPrimary: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiPrimaryText: { fontSize: 12, fontWeight: "600", color: colors.foreground },
  aiDismiss: { fontSize: 12, fontWeight: "600", color: "rgba(250, 249, 246, 0.7)", padding: 6 },
  stats: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    gap: 8,
  },
});
