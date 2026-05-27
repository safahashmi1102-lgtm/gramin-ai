import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { BottomNav, type Screen } from "./src/components/BottomNav";
import { PhoneStatusBar } from "./src/components/PhoneStatusBar";
import { MarkersProvider } from "./src/context/MarkersContext";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { HouseholdsScreen } from "./src/screens/HouseholdsScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { SurveyScreen } from "./src/screens/SurveyScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  const [screen, setScreen] = useState<Screen>("map");

  return (
    <SafeAreaProvider>
      <MarkersProvider>
        <LinearGradient
          colors={[colors.stone200, colors.stone100, colors.amber50]}
          style={styles.gradient}
        >
          <StatusBar style="dark" />
          <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            <View style={styles.phone}>
              <PhoneStatusBar />
              <View style={styles.body}>
                {screen === "map" && <MapScreen />}
                {screen === "survey" && <SurveyScreen onBack={() => setScreen("map")} />}
                {screen === "households" && <HouseholdsScreen />}
                {screen === "dashboard" && <DashboardScreen />}
              </View>
              <BottomNav screen={screen} setScreen={setScreen} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </MarkersProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  phone: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  body: {
    flex: 1,
  },
});
