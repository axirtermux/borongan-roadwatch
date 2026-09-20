import React, { useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { WebView } from "react-native-webview";
import { BORONGAN_CENTER, BORONGAN_BOUNDS } from "../config/supabase";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  severity?: "low" | "medium" | "high" | "critical" | string;
  damageType?: string;
  roadName?: string;
}

interface GoogleSatelliteMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markers?: MapMarker[];
  selectable?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: number;
  interactive?: boolean;
}

export function GoogleSatelliteMap({
  latitude = BORONGAN_CENTER.latitude,
  longitude = BORONGAN_CENTER.longitude,
  zoom = 15,
  markers = [],
  selectable = false,
  onLocationSelect,
  height = 280,
  interactive = true,
}: GoogleSatelliteMapProps) {
  const webViewRef = useRef<WebView>(null);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#ca8a04";
      case "low":
        return "#16a34a";
      default:
        return "#2563eb";
    }
  };

  const markersJson = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.latitude,
      lng: m.longitude,
      title: m.title || "Road Defect",
      color: getSeverityColor(m.severity),
      severity: m.severity || "normal",
      road: m.roadName || "",
      type: (m.damageType || "pothole").replace("_", " "),
    }))
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #0b1120;
          }
          .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.6);
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
          }
          .pin-pulse {
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(255, 130, 0, 0.4);
            animation: pulse 1.6s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          .satellite-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(0, 39, 118, 0.85);
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 6px;
            font-family: sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            pointer-events: none;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          }
          .leaflet-popup-content {
            font-family: sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 10px 12px;
          }
        </style>
      </head>
      <body>
        <div class="satellite-badge">🛰️ GOOGLE SATELLITE</div>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            center: [${latitude}, ${longitude}],
            zoom: ${zoom},
            zoomControl: ${interactive},
            dragging: ${interactive},
            touchZoom: ${interactive},
            scrollWheelZoom: ${interactive}
          });

          // Google Maps Hybrid Satellite Layer (Satellite + Streets/Labels)
          var googleHybrid = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20,
            attribution: '© Google Satellite'
          }).addTo(map);

          // Borongan Jurisdiction Boundaries
          var boronganBounds = [
            [${BORONGAN_BOUNDS.minLat}, ${BORONGAN_BOUNDS.minLng}],
            [${BORONGAN_BOUNDS.maxLat}, ${BORONGAN_BOUNDS.maxLng}]
          ];
          L.rectangle(boronganBounds, {
            color: '#3b82f6',
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: '#3b82f6',
            fillOpacity: 0.05
          }).addTo(map);

          var activeMarker = null;

          ${
            selectable
              ? `
          // Active selectable marker with pulse
          var customIcon = L.divIcon({
            className: 'marker-container',
            html: '<div class="pin-pulse"></div><div class="custom-pin" style="background:#ff8200;">📍</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          });

          activeMarker = L.marker([${latitude}, ${longitude}], {
            icon: customIcon,
            draggable: true
          }).addTo(map);

          activeMarker.on('dragend', function(e) {
            var coord = e.target.getLatLng();
            sendLocation(coord.lat, coord.lng);
          });

          map.on('click', function(e) {
            if (activeMarker) {
              activeMarker.setLatLng(e.latlng);
            } else {
              activeMarker = L.marker(e.latlng, { icon: customIcon, draggable: true }).addTo(map);
            }
            sendLocation(e.latlng.lat, e.latlng.lng);
          });

          function sendLocation(lat, lng) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_selected',
                latitude: lat,
                longitude: lng
              }));
            }
          }
          `
              : `
          // Single focus marker if not selectable but has coords
          ${
            markers.length === 0
              ? `
          var focusIcon = L.divIcon({
            className: 'marker-container',
            html: '<div class="custom-pin" style="background:#ea580c;">⚠️</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          });
          L.marker([${latitude}, ${longitude}], { icon: focusIcon }).addTo(map);
          `
              : ""
          }
          `
          }

          // Render multiple markers if provided
          var markersList = ${markersJson};
          markersList.forEach(function(m) {
            var icon = L.divIcon({
              className: 'marker-container',
              html: '<div class="custom-pin" style="background:' + m.color + ';">•</div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
            marker.bindPopup(
              '<b>' + m.title + '</b><br/>' +
              '<span>' + m.road + '</span><br/>' +
              '<span>Type: <b>' + m.type + '</b></span><br/>' +
              '<span style="color:' + m.color + '; font-weight:bold;">Severity: ' + m.severity.toUpperCase() + '</span>'
            );
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#ff8200" />
            <Text style={styles.loadingText}>Loading Google Satellite Map...</Text>
          </View>
        )}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "location_selected" && onLocationSelect) {
              onLocationSelect(data.latitude, data.longitude);
            }
          } catch (err) {
            console.warn("Map message error:", err);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#0b1120",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
});
