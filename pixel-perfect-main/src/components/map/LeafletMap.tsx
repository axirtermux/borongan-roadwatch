import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { MapProps } from "./map-types";

function Recenter({ center, recenterKey }: { center: [number, number]; recenterKey: string }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey, center[0], center[1]]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({
  center,
  zoom = 14,
  markers = [],
  onPick,
  className,
  recenterKey,
}: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={className ?? ""}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} recenterKey={recenterKey ?? ""} />
      {onPick ? <ClickHandler onPick={onPick} /> : null}
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: marker.color,
            fillOpacity: 0.95,
          }}
        >
          {marker.content ? <Popup minWidth={220}>{marker.content}</Popup> : null}
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
