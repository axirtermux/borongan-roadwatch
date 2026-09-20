import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { supabase } from "../config/supabase";

export function HomeScreen({ navigation }: { navigation: any }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const fetchReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReports(data);
        setStats({
          total: data.length,
          pending: data.filter((r) => ["submitted", "under_review"].includes(r.status)).length,
          completed: data.filter((r) => r.status === "completed").length,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#16a34a";
      case "in_progress":
      case "scheduled":
        return "#2563eb";
      case "verified":
        return "#7c3aed";
      case "under_review":
        return "#ca8a04";
      case "rejected":
        return "#dc2626";
      default:
        return "#64748b";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.dpwhLogoContainer}>
            <Image
              source={require("../../assets/dpwh-logo.png")}
              style={styles.dpwhLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTag}>CITY GOVERNMENT OF BORONGAN</Text>
            <Text style={styles.headerTitle}>Borongan RoadWatch</Text>
            <Text style={styles.headerSubtitle}>
              City Engineering Office · DPWH Partnership
            </Text>
          </View>
        </View>
      </View>

      {/* Limitation 1 & 7 Notice */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Scope & Limitations Notice</Text>
        <Text style={styles.disclaimerText}>
          Exclusively designed to record, map, and track routine road surface defects (potholes,
          cracks, erosion) solely within Borongan City. Structural bridge failures or non-road
          infrastructure must be reported to DPWH/CDRRMO.
        </Text>
      </View>

      {/* Primary Report Action Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate("ReportDamage")}
        activeOpacity={0.85}
      >
        <Text style={styles.reportButtonIcon}>📷</Text>
        <View style={styles.reportButtonTextContainer}>
          <Text style={styles.reportButtonTitle}>Capture & Report Road Damage</Text>
          <Text style={styles.reportButtonDesc}>Real-time photo upload with smartphone GPS coordinates</Text>
        </View>
        <Text style={styles.reportButtonArrow}>→</Text>
      </TouchableOpacity>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Reports Submitted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#ca8a04" }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Repairs Done</Text>
        </View>
      </View>

      {/* Secondary Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => navigation.navigate("MyReports")}
        >
          <Text style={styles.secondaryActionText}>📋 My Reports ({reports.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => navigation.navigate("Map")}
        >
          <Text style={styles.secondaryActionText}>🗺️ Satellite Map</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Incident Submissions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MyReports")}>
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#1e3a8a" style={{ marginTop: 20 }} />
      ) : reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No reports submitted yet</Text>
          <Text style={styles.emptySub}>
            Seen a damaged road or pothole in Borongan? Tap the button above to file your first report.
          </Text>
        </View>
      ) : (
        reports.slice(0, 4).map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => navigation.navigate("ReportDetail", { reportId: report.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardRef}>{report.reference_code}</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${getStatusColor(report.status)}18` },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                  {report.status.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{report.title}</Text>
            <Text style={styles.cardLocation}>
              📍 {report.road_name}, Brgy. {report.barangay}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardType}>{report.damage_type.replace("_", " ")}</Text>
              <Text style={styles.cardDate}>
                {new Date(report.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerBanner: {
    backgroundColor: "#002776",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dpwhLogoContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dpwhLogo: {
    width: 54,
    height: 36,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTag: { color: "#fbbf24", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  headerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  headerSubtitle: { color: "#e2e8f0", fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  disclaimerBox: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 12,
  },
  disclaimerTitle: { color: "#1e40af", fontSize: 12, fontWeight: "700" },
  disclaimerText: { color: "#475569", fontSize: 11, marginTop: 2, lineHeight: 16 },
  reportButton: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FF8200",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonIcon: { fontSize: 28, marginRight: 12 },
  reportButtonTextContainer: { flex: 1 },
  reportButtonTitle: { color: "#0f172a", fontSize: 16, fontWeight: "800" },
  reportButtonDesc: { color: "#451a03", fontSize: 11, marginTop: 2, fontWeight: "500" },
  reportButtonArrow: { color: "#0f172a", fontSize: 20, fontWeight: "800", marginLeft: 8 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 10, color: "#64748b", marginTop: 4, textAlign: "center" },
  actionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryActionText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  seeAllText: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#334155" },
  emptySub: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 6, lineHeight: 18 },
  reportCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardRef: { fontSize: 11, fontFamily: "monospace", color: "#64748b", fontWeight: "600" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "800" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 6 },
  cardLocation: { fontSize: 12, color: "#475569", marginTop: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cardType: { fontSize: 11, color: "#2563eb", fontWeight: "600", textTransform: "capitalize" },
  cardDate: { fontSize: 11, color: "#94a3b8" },
});
