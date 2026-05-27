# Naksha AI

Expo React Native mobile app for village house surveying — ported from the Village Map AI web UI with live OpenStreetMap, GPS, and locally saved house markers.

## Features

- **OpenStreetMap** tiles via `react-native-maps` (works in **Expo Go** on Android)
- **Live GPS** with `expo-location` and blue user dot on the map
- **Tap the map** to place house markers (`H-001`, `H-002`, …)
- **AsyncStorage** persistence across app restarts
- Same screens and layout as the original web app (Map, Houses, Survey, Stats)

## Run on Android (Expo Go)

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) on your Android phone.
2. From this folder:

```bash
cd naksha-ai-temp-temp
npm install
npm start
```

3. Scan the QR code with Expo Go (same Wi‑Fi as your PC).
4. Grant **location** permission when prompted.

Use the **navigation** button (top-right on the map) to center on your GPS position.

## Project structure

```
App.tsx                 # Shell + navigation
src/
  screens/              # Map, Survey, Households, Dashboard
  components/             # Bottom nav, house pins, shared UI
  context/MarkersContext  # Marker state + persistence
  storage/markers.ts      # AsyncStorage helpers
  theme/colors.ts         # Design tokens from web app
```

## Notes

- Markers are numbered sequentially from `H-001` (counter stored locally).
- Demo household rows (H-012–H-015) remain; new placements appear at the top of the Houses list.
- OSM tile usage follows the [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/); use a dedicated tile server for production.
