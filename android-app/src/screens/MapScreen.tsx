import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase, BORONGAN_CENTER } from "../config/supabase";
import { GoogleSatelliteMap, MapMarker } from "../components/GoogleSatelliteMap";

export function MapScreen({ navigation }: { navigation: any }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, title, road_name, barangay, damage_type, severity_level, latitude, longitude, status")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching map reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports =
    selectedSeverity === "all"
      ? reports
      : reports.filter((r) => r.severity_level === selectedSeverity);

  const markers: MapMarker[] = filteredReports.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    title: r.title,
    severity: r.severity_level,
    damageType: r.damage_type,
    roadName: `${r.road_name}, Brgy. ${r.barangay}`,
  }));

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.topInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Borongan GIS Satellite Map</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchReports}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>
          Real Google Satellite imagery of road surface defects across Borongan City.
        </Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { key: "all", label: `All (${reports.length})` },
            { key: "critical", label: "Critical" },
            { key: "high", label: "High" },
            { key: "medium", label: "Medium" },
            { key: "low", label: "Low" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterPill,
                selectedSeverity === f.key && styles.filterPillActive,
              ]}
              onPress={() => setSelectedSeverity(f.key)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedSeverity === f.key && styles.filterPillTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Real Google Satellite Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#ff8200" />
            <Text style={styles.loadingText}>Loading Google Satellite GIS...</Text>
          </View>
        ) : (
          <GoogleSatelliteMap
            latitude={BORONGAN_CENTER.latitude}
            longitude={BORONGAN_CENTER.longitude}
            zoom={14}
            markers={markers}
            height={500}
            interactive={true}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ReportDamage")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>➕</Text>
        <Text style={styles.fabText}>Report Incident</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  topInfo: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#002776",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  sub: { fontSize: 11, color: "#93c5fd", marginTop: 2, marginBottom: 8 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  filterPillActive: { backgroundColor: "#ff8200" },
  filterPillText: { fontSize: 10, fontWeight: "700", color: "#e2e8f0" },
  filterPillTextActive: { color: "#ffffff" },
  mapContainer: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94a3b8", fontSize: 12, marginTop: 8 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ff8200",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: { fontSize: 16, marginRight: 6, color: "#ffffff" },
  fabText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
});
