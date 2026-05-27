import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type House = {
  id: number;
  lat: number;
  lng: number;
};

const blueIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 18);
  }, [lat, lng]);

  return null;
}

export default function App() {
  const [position, setPosition] = useState({
    lat: 26.4499,
    lng: 80.3319,
  });

  const [houses, setHouses] = useState<House[]>([]);

  useEffect(() => {
    navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error(err);
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, []);

  const addHouse = () => {
    const newHouse: House = {
      id: houses.length + 1,
      lat: position.lat,
      lng: position.lng,
    };

    setHouses([...houses, newHouse]);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <button
        onClick={addHouse}
        style={{
          position: "absolute",
          zIndex: 1000,
          top: 20,
          left: 20,
          padding: "12px 18px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "10px",
        }}
      >
        Add House
      </button>

      <MapContainer
        center={[position.lat, position.lng]}
        zoom={18}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap lat={position.lat} lng={position.lng} />

        <Marker position={[position.lat, position.lng]} icon={blueIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {houses.map((house) => (
          <Marker
            key={house.id}
            position={[house.lat, house.lng]}
            icon={blueIcon}
          >
            <Popup>House #{house.id}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}