import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
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
import type { TrailCoordinate } from "@/context/NakshaContext";
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
  onMapCreated?: (map: L.Map) => void;
  onTileLoadingChange?: (loading: boolean) => void;
  trailCoordinates: TrailCoordinate[];
  trailVisible: boolean;
};

function TileLoadTracker({
  onMapCreated,
  onTileLoadingChange,
}: {
  onMapCreated?: (map: L.Map) => void;
  onTileLoadingChange?: (loading: boolean) => void;
}) {
  const map = useMap();
  const pendingTilesRef = useRef(0);

  useEffect(() => {
    onMapCreated?.(map);

    const tileListeners = new Map<L.TileLayer, () => void>();

    const updateLoading = () => {
      onTileLoadingChange?.(pendingTilesRef.current > 0);
    };

    const attachTileLayer = (layer: L.Layer) => {
      if (!(layer instanceof L.TileLayer)) return;

      const onTileStart = () => {
        pendingTilesRef.current += 1;
        if (pendingTilesRef.current === 1) updateLoading();
      };

      const onTileFinish = () => {
        pendingTilesRef.current = Math.max(0, pendingTilesRef.current - 1);
        if (pendingTilesRef.current === 0) updateLoading();
      };

      layer.on("tileloadstart", onTileStart);
      layer.on("tileload tileerror", onTileFinish);

      tileListeners.set(layer, () => {
        layer.off("tileloadstart", onTileStart);
        layer.off("tileload tileerror", onTileFinish);
      });
    };

    map.eachLayer((layer) => attachTileLayer(layer));

    const onLayerAdd = (event: { layer: L.Layer }) => attachTileLayer(event.layer);
    const onLayerRemove = (event: { layer: L.Layer }) => {
      const cleanup = tileListeners.get(event.layer as L.TileLayer);
      if (cleanup) cleanup();
      tileListeners.delete(event.layer as L.TileLayer);
    };

    map.on("layeradd", onLayerAdd);
    map.on("layerremove", onLayerRemove);

    updateLoading();

    return () => {
      map.off("layeradd", onLayerAdd);
      map.off("layerremove", onLayerRemove);
      tileListeners.forEach((cleanup) => cleanup());
      tileListeners.clear();
    };
  }, [map, onMapCreated, onTileLoadingChange]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapInteractionHandler({
  userInteractingRef,
}: {
  userInteractingRef: MutableRefObject<boolean>;
}) {
  const map = useMap();
  const interactionTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearInteraction = () => {
      if (interactionTimer.current) {
        window.clearTimeout(interactionTimer.current);
        interactionTimer.current = null;
      }
      userInteractingRef.current = false;
    };

    const scheduleClear = () => {
      if (interactionTimer.current) {
        window.clearTimeout(interactionTimer.current);
      }
      interactionTimer.current = window.setTimeout(() => {
        userInteractingRef.current = false;
        interactionTimer.current = null;
      }, 1200);
    };

    const startInteraction = () => {
      userInteractingRef.current = true;
      scheduleClear();
    };

    map.on("movestart", startInteraction);
    map.on("zoomstart", startInteraction);
    map.on("touchstart", startInteraction);
    map.on("wheel", startInteraction);
    map.on("mousedown", startInteraction);

    map.on("moveend zoomend", scheduleClear);

    return () => {
      map.off("movestart", startInteraction);
      map.off("zoomstart", startInteraction);
      map.off("touchstart", startInteraction);
      map.off("wheel", startInteraction);
      map.off("mousedown", startInteraction);
      map.off("moveend zoomend", scheduleClear);
      clearInteraction();
    };
  }, [map, userInteractingRef]);

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
  userInteractingRef,
}: {
  userPosition: GpsPosition | null;
  markers: HouseRecord[];
  centerOnUserSignal: number;
  fitAllSignal: number;
  navigateSignal: number;
  navigateTarget: { lat: number; lng: number } | null;
  followGps: boolean;
  userInteractingRef: MutableRefObject<boolean>;
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
    if (!followGps || !userPosition || userInteractingRef.current) return;
    const now = Date.now();
    if (now - lastFollow.current < 1200) return;
    lastFollow.current = now;
    const z = map.getZoom();
    map.panTo([userPosition.lat, userPosition.lng], { animate: true, duration: 0.4 });
    if (z < 17) map.setZoom(17, { animate: true });
  }, [followGps, userPosition, map, userInteractingRef]);

  return null;
}

// MapTiler API Key from environment (add your key to .env.local as VITE_MAPTILER_API_KEY for premium satellite)
// Default uses free Esri World Imagery which provides excellent resolution
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || "";
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_TILE_ATTRIBUTION =
  "Tiles © Esri, Imagery © Maxar, Earthstar Geographics";
export const SATELLITE_MAX_ZOOM = 22;


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
  onMapCreated,
  onTileLoadingChange,
  trailCoordinates,
  trailVisible,
}: VillageMapProps) {
  const [mounted, setMounted] = useState(false);
  const initialCenter = useRef<[number, number]>([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);

  const positions = useMemo(
    () => displayPositions(markers, denseSettlement),
    [markers, denseSettlement],
  );

  const trailLatLngs = useMemo(
    () => trailCoordinates.map((coord) => [coord.lat, coord.lng] as [number, number]),
    [trailCoordinates],
  );

  const mapRef = useRef<L.Map | null>(null);
  const userInteractingRef = useRef(false);
  const { highlightedUids } = useNaksha();
  const currentMaxZoom = mapLayer === "satellite" ? 21 : 19;
  const zoomStep = 0.5;

  const handleLocalMapCreated = (map: L.Map) => {
    mapRef.current = map;
    onMapCreated?.(map);
  };

  const adjustZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const target = Math.min(currentMaxZoom, Math.max(map.getMinZoom(), map.getZoom() + delta));
    map.setZoom(target, { animate: true });
  };

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
        maxZoom={currentMaxZoom}
        zoomSnap={0.5}
        zoomDelta={0.5}
        className="h-full w-full naksha-leaflet-map"
        zoomControl={false}
        attributionControl={false}
       ref={(mapInstance) => {
  if (mapInstance) {
    handleLocalMapCreated(mapInstance);
  }
}}
      >
        <TileLoadTracker
          onMapCreated={onMapCreated}
          onTileLoadingChange={onTileLoadingChange}
        />
        <MapInteractionHandler userInteractingRef={userInteractingRef} />
        {mapLayer === "satellite" ? (
          <TileLayer
            url={SATELLITE_TILE_URL}
            attribution={SATELLITE_TILE_ATTRIBUTION}
            maxZoom={SATELLITE_MAX_ZOOM}
            maxNativeZoom={SATELLITE_MAX_ZOOM}
            crossOrigin="anonymous"
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
            crossOrigin="anonymous"

          
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
          userInteractingRef={userInteractingRef}
        />
        {trailVisible && trailLatLngs.length > 1 ? (
          <Polyline
            positions={trailLatLngs}
            pathOptions={{
              color: "#7d5bff",
              weight: 3,
              opacity: 0.65,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
        ) : null}
        {userPosition?.accuracy != null && userPosition.accuracy > 0 ? (
          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={userPosition.accuracy}
            pathOptions={{
              color: "#35a77d",
              fillColor: "#35a77d",
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
