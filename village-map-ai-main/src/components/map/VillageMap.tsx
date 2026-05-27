import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { displayPositions } from "@/lib/naksha-dense";
import { useNaksha } from "@/context/NakshaContext";
import type { HouseRecord } from "@/lib/naksha-types";
import { DEFAULT_CENTER } from "@/lib/naksha-types";
import type { GpsPosition } from "@/lib/naksha-types";
import type { MapLayer } from "@/lib/naksha-types";
import { createHouseIcon, createUserLocationIcon } from "./house-icon";
import "leaflet/dist/leaflet.css";

type VillageMapProps = {
  markers: HouseRecord[];
  userPosition: GpsPosition | null;
  denseSettlement: boolean;
  followGps: boolean;
  mapLayer: MapLayer;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (uid: string) => void;
  centerOnUserSignal: number;
  fitAllSignal: number;
  navigateSignal: number;
  navigateTarget: { lat: number; lng: number } | null;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({
  userPosition,
  markers,
  centerOnUserSignal,
  fitAllSignal,
  navigateSignal,
  navigateTarget,
  followGps,
}: {
  userPosition: GpsPosition | null;
  markers: HouseRecord[];
  centerOnUserSignal: number;
  fitAllSignal: number;
  navigateSignal: number;
  navigateTarget: { lat: number; lng: number } | null;
  followGps: boolean;
}) {
  const map = useMap();
  const lastFollow = useRef(0);

  useEffect(() => {
    if (centerOnUserSignal === 0) return;
    if (userPosition) map.flyTo([userPosition.lat, userPosition.lng], 19, { duration: 0.6 });
  }, [centerOnUserSignal, userPosition, map]);

  useEffect(() => {
    if (fitAllSignal === 0) return;
    if (markers.length === 0) {
      map.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 16);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    if (userPosition) bounds.extend([userPosition.lat, userPosition.lng]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 21 });
  }, [fitAllSignal, markers, userPosition, map]);

  useEffect(() => {
    if (navigateSignal === 0 || !navigateTarget) return;
    map.flyTo([navigateTarget.lat, navigateTarget.lng], 18, { duration: 0.8 });
  }, [navigateSignal, navigateTarget, map]);

  useEffect(() => {
    if (!followGps || !userPosition) return;
    const now = Date.now();
    if (now - lastFollow.current < 1200) return;
    lastFollow.current = now;
    const z = map.getZoom();
    map.panTo([userPosition.lat, userPosition.lng], { animate: true, duration: 0.4 });
    if (z < 17) map.setZoom(17);
  }, [followGps, userPosition, map]);

  return null;
}

// MapTiler API Key from environment (add your key to .env.local as VITE_MAPTILER_API_KEY for premium satellite)
// Default uses free Esri World Imagery which provides excellent resolution
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || "";
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_TILE_ATTRIBUTION =
  "Tiles © Esri, Imagery © Maxar, Earthstar Geographics";
const SATELLITE_MAX_ZOOM = 22;


export function VillageMap({
  markers,
  userPosition,
  denseSettlement,
  followGps,
  mapLayer,
  onMapClick,
  onMarkerClick,
  centerOnUserSignal,
  fitAllSignal,
  navigateSignal,
  navigateTarget,
  mapContainerRef,
}: VillageMapProps) {
  const [mounted, setMounted] = useState(false);
  const initialCenter = useRef<[number, number]>([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);

  const positions = useMemo(
    () => displayPositions(markers, denseSettlement),
    [markers, denseSettlement],
  );

  const { highlightedUids } = useNaksha();

  useEffect(() => {
    setMounted(true);
    if (userPosition) initialCenter.current = [userPosition.lat, userPosition.lng];
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 bg-topo animate-pulse" />;
  }

  return (
    <div ref={mapContainerRef} className="absolute inset-0 z-0">
      <MapContainer
        center={initialCenter.current}
        zoom={19}
        className="h-full w-full naksha-leaflet-map"
        zoomControl={false}
        attributionControl={false}
      >
        {mapLayer === "satellite" ? (
          <TileLayer
            url={SATELLITE_TILE_URL}
            attribution={SATELLITE_TILE_ATTRIBUTION}
            maxZoom={SATELLITE_MAX_ZOOM}
            maxNativeZoom={SATELLITE_MAX_ZOOM}
            
          />
        ) : (
          <TileLayer
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
           subdomains={['a', 'b', 'c']}
           attribution="&copy; OpenStreetMap contributors"
           maxZoom={19}

          
          />
        )}
        <MapClickHandler onMapClick={onMapClick} />
        <MapController
          userPosition={userPosition}
          markers={markers}
          centerOnUserSignal={centerOnUserSignal}
          fitAllSignal={fitAllSignal}
          navigateSignal={navigateSignal}
          navigateTarget={navigateTarget}
          followGps={followGps}
        />
        {userPosition?.accuracy != null && userPosition.accuracy > 0 ? (
          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={userPosition.accuracy}
            pathOptions={{
              color: "oklch(0.42 0.08 155)",
              fillColor: "oklch(0.42 0.08 155)",
              fillOpacity: 0.12,
              weight: 1,
            }}
          />
        ) : null}
        {userPosition ? (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={createUserLocationIcon(userPosition.heading)}
            interactive={false}
            zIndexOffset={2000}
          />
        ) : null}
        {markers.map((m) => {
          const pos = positions.get(m.uid) ?? { lat: m.lat, lng: m.lng };
          return (
            <Marker
              key={m.uid}
              position={[pos.lat, pos.lng]}
              icon={createHouseIcon(m.status, m.houseNumber, highlightedUids.includes(m.uid))}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  onMarkerClick(m.uid);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
