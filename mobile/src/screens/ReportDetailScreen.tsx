import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { supabase, SUPABASE_URL } from "../config/supabase";
import { GoogleSatelliteMap } from "../components/GoogleSatelliteMap";

const WORKFLOW_STEPS = [
  { key: "submitted", label: "1. Submitted" },
  { key: "under_review", label: "2. Under Review" },
  { key: "verified", label: "3. Verified" },
  { key: "scheduled", label: "4. Scheduled" },
  { key: "in_progress", label: "5. In Progress" },
  { key: "completed", label: "6. Completed" },
];

export function ReportDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { reportId } = route.params;
  const [report, setReport] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data: repData, error: repErr } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (!repErr && repData) {
          setReport(repData);
        }

        const { data: updData, error: updErr } = await supabase
          .from("maintenance_updates")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: true });

        if (!updErr && updData) {
          setUpdates(updData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loadingCenter}>
        <Text style={styles.notFoundTitle}>Report Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Reports</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.key === report.status);
  const photoFullUrl = report.photo_url
    ? `${SUPABASE_URL}/storage/v1/object/public/damage-photos/${report.photo_url}`
    : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <Text style={styles.refCode}>{report.reference_code}</Text>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.location}>
          📍 {report.road_name}, Brgy. {report.barangay}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: "#eff6ff" }]}>
            <Text style={[styles.badgeText, { color: "#2563eb" }]}>
              {report.damage_type.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  report.severity_level === "critical"
                    ? "#fee2e2"
                    : report.severity_level === "high"
                      ? "#ffedd5"
                      : "#fef9c3",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    report.severity_level === "critical"
                      ? "#dc2626"
                      : report.severity_level === "high"
                        ? "#ea580c"
                        : "#ca8a04",
                },
              ]}
            >
              SEVERITY: {report.severity_level.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Objective 4: Real-time Status Tracking Module */}
      <View style={styles.trackingCard}>
        <Text style={styles.sectionHeaderTitle}>Repair Progress Workflow (Objective 4)</Text>
        <Text style={styles.sectionSubtitle}>
          Real-time visibility over the municipal maintenance pipeline.
        </Text>

        <View style={styles.timelineContainer}>
          {WORKFLOW_STEPS.map((step, idx) => {
            const isDone = currentStepIdx >= idx && report.status !== "rejected";
            const isCurrent = currentStepIdx === idx && report.status !== "rejected";
            return (
              <View key={step.key} style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    isDone && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  <Text style={[styles.timelineDotText, isDone && styles.timelineDotTextDone]}>
                    {isDone ? "✓" : idx + 1}
                  </Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineStepLabel,
                      isDone && styles.timelineStepLabelDone,
                      isCurrent && styles.timelineStepLabelCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isCurrent ? (
                    <Text style={styles.currentIndicator}>Current Municipal Stage</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {report.status === "rejected" ? (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedText}>
              This report was evaluated and rejected by the City Engineering Office (non-qualifying
              or non-road surface incident).
            </Text>
          </View>
        ) : null}
      </View>

      {/* Status History & Engineer Notes */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Engineering Activity & Notes</Text>
        {updates.length === 0 ? (
          <Text style={styles.emptyNote}>
            No maintenance remarks recorded yet. Report is awaiting initial engineering inspection.
          </Text>
        ) : (
          updates.map((upd) => (
            <View key={upd.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyStatus}>
                  Status changed to: {upd.status.replace("_", " ").toUpperCase()}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(upd.created_at).toLocaleDateString()}
                </Text>
              </View>
              {upd.engineer_notes ? (
                <Text style={styles.historyNotes}>💬 {upd.engineer_notes}</Text>
              ) : null}
              {upd.repair_date ? (
                <Text style={styles.historyRepairDate}>
                  🗓️ Scheduled Work Date: {new Date(upd.repair_date).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Geotagged Photographic Proof */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Photographic Evidence & Geotag</Text>
        {photoFullUrl ? (
          <Image source={{ uri: photoFullUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.noPhotoBox}>
            <Text style={styles.noPhotoText}>Photo path: {report.photo_url}</Text>
          </View>
        )}
        <View style={styles.coordsBox}>
          <Text style={styles.coordsLabel}>Verified GPS Sensor Coordinates (Scope 2):</Text>
          <Text style={styles.coordsValue}>
            {report.latitude.toFixed(6)}° N, {report.longitude.toFixed(6)}° E
          </Text>
          <Text style={styles.coordsScope}>Jurisdiction: Borongan City, Eastern Samar</Text>
        </View>

        {/* Real Google Satellite Map */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
            🛰️ Incident Satellite GIS Location:
          </Text>
          <GoogleSatelliteMap
            latitude={report.latitude}
            longitude={report.longitude}
            zoom={17}
            height={220}
            interactive={true}
          />
        </View>
      </View>

      {/* Limitation 5 Notice */}
      <View style={styles.limitationBox}>
        <Text style={styles.limitationTitle}>Administrative Workflow Note (Limitation 5)</Text>
        <Text style={styles.limitationText}>
          The system tracks repair schedules and milestone logs. Dispatch of physical road crews and
          heavy equipment is executed manually by the City Engineering Office.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingTop: 16 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { marginTop: 10, color: "#64748b", fontSize: 13 },
  notFoundTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  backBtn: { marginTop: 14, backgroundColor: "#2563eb", padding: 10, borderRadius: 10 },
  backBtnText: { color: "#ffffff", fontWeight: "600" },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  refCode: { fontFamily: "monospace", fontSize: 12, color: "#64748b", fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 4 },
  location: { fontSize: 13, color: "#475569", marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  trackingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  sectionHeaderTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  sectionSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2, marginBottom: 14 },
  timelineContainer: { borderLeftWidth: 2, borderLeftColor: "#e2e8f0", marginLeft: 12, paddingLeft: 16 },
  timelineStep: { marginBottom: 14, flexDirection: "row", alignItems: "flex-start" },
  timelineDot: {
    position: "absolute",
    left: -24,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: "#2563eb" },
  timelineDotCurrent: { backgroundColor: "#1e40af", borderWidth: 2, borderColor: "#93c5fd" },
  timelineDotText: { color: "#ffffff", fontSize: 9, fontWeight: "800" },
  timelineDotTextDone: { color: "#ffffff" },
  timelineContent: { marginLeft: 6 },
  timelineStepLabel: { fontSize: 13, color: "#64748b" },
  timelineStepLabelDone: { color: "#0f172a", fontWeight: "600" },
  timelineStepLabelCurrent: { color: "#1e40af", fontWeight: "800" },
  currentIndicator: { fontSize: 10, color: "#2563eb", fontWeight: "700", marginTop: 2 },
  rejectedBanner: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 10, marginTop: 10 },
  rejectedText: { color: "#dc2626", fontSize: 11, fontWeight: "600" },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  emptyNote: { fontSize: 12, color: "#94a3b8", marginTop: 8 },
  historyItem: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  historyStatus: { fontSize: 12, fontWeight: "700", color: "#1e3a8a" },
  historyDate: { fontSize: 10, color: "#94a3b8" },
  historyNotes: { fontSize: 12, color: "#334155", marginTop: 2 },
  historyRepairDate: { fontSize: 11, color: "#16a34a", fontWeight: "600", marginTop: 4 },
  photo: { width: "100%", height: 200, borderRadius: 12, marginTop: 10 },
  noPhotoBox: {
    height: 80,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  noPhotoText: { color: "#64748b", fontSize: 11 },
  coordsBox: { marginTop: 10, backgroundColor: "#f8fafc", padding: 10, borderRadius: 10 },
  coordsLabel: { fontSize: 10, color: "#64748b" },
  coordsValue: { fontSize: 12, fontWeight: "700", fontFamily: "monospace", color: "#0f172a", marginTop: 2 },
  coordsScope: { fontSize: 10, color: "#2563eb", marginTop: 2 },
  limitationBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  limitationTitle: { fontSize: 11, fontWeight: "700", color: "#475569" },
  limitationText: { fontSize: 10, color: "#64748b", marginTop: 2, lineHeight: 15 },
});
