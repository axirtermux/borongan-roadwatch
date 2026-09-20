import * as Location from "expo-location";
import { BORONGAN_BOUNDS, BORONGAN_CENTER } from "../config/supabase";

export interface GPSLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isWithinBorongan: boolean;
  timestamp: number;
}

/**
 * Objective 1 & Scope 2:
 * Capture and verify geographical latitude and longitude coordinates
 * using built-in smartphone sensor hardware (GPS).
 */
export async function requestAndGetGPSLocation(): Promise<GPSLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access smartphone GPS hardware was denied.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const lat = location.coords.latitude;
  const lng = location.coords.longitude;

  const isWithinBorongan =
    lat >= BORONGAN_BOUNDS.minLat &&
    lat <= BORONGAN_BOUNDS.maxLat &&
    lng >= BORONGAN_BOUNDS.minLng &&
    lng <= BORONGAN_BOUNDS.maxLng;

  return {
    latitude: lat,
    longitude: lng,
    accuracy: location.coords.accuracy,
    isWithinBorongan,
    timestamp: location.timestamp,
  };
}

export function verifyCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= BORONGAN_BOUNDS.minLat &&
    lat <= BORONGAN_BOUNDS.maxLat &&
    lng >= BORONGAN_BOUNDS.minLng &&
    lng <= BORONGAN_BOUNDS.maxLng
  );
}
