import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../config/supabase";

export function MyReportsScreen({ navigation }: { navigation: any }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      r.title.toLowerCase().includes(term) ||
      r.road_name.toLowerCase().includes(term) ||
      r.reference_code.toLowerCase().includes(term) ||
      r.barangay.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by reference, road or barangay..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.filterRow}>
        {["all", "submitted", "verified", "scheduled", "completed"].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
            onPress={() => setFilterStatus(st)}
          >
            <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
              {st === "all" ? "All Reports" : st.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#1e3a8a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ReportDetail", { reportId: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardRef}>{item.reference_code}</Text>
                <Text style={styles.cardStatus}>{item.status.replace("_", " ").toUpperCase()}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>
                📍 {item.road_name}, Brgy. {item.barangay}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.cardArrow}>Track Status →</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching road damage reports found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingTop: 16 },
  searchBarContainer: { marginBottom: 10 },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    fontSize: 13,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  filterChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 11, color: "#475569", fontWeight: "600", textTransform: "capitalize" },
  filterChipTextActive: { color: "#ffffff" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardRef: { fontSize: 11, fontFamily: "monospace", color: "#64748b", fontWeight: "700" },
  cardStatus: { fontSize: 9, fontWeight: "800", color: "#2563eb" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  cardSub: { fontSize: 12, color: "#475569", marginTop: 2 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cardDate: { fontSize: 11, color: "#94a3b8" },
  cardArrow: { fontSize: 11, color: "#2563eb", fontWeight: "700" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 13 },
});
