import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase, BARANGAYS, BORONGAN_CENTER } from "../config/supabase";
import { requestAndGetGPSLocation, verifyCoordinates } from "../services/location";
import {
  classifyMobileDamage,
  type DamageType,
  type SeverityLevel,
} from "../services/classifier";
import { GoogleSatelliteMap } from "../components/GoogleSatelliteMap";

const DAMAGE_TYPES: { key: DamageType; label: string }[] = [
  { key: "pothole", label: "Pothole (Cavity)" },
  { key: "road_crack", label: "Road Crack (Fissure)" },
  { key: "surface_erosion", label: "Surface Erosion" },
  { key: "uneven_pavement", label: "Uneven Pavement" },
  { key: "road_subsidence", label: "Road Subsidence (Dip)" },
  { key: "other", label: "Other Routine Defect" },
];

export function ReportDamageScreen({ navigation }: { navigation: any }) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roadName, setRoadName] = useState("");
  const [barangay, setBarangay] = useState(BARANGAYS[0]);
  const [damageType, setDamageType] = useState<DamageType>("pothole");
  const [depthCategory, setDepthCategory] = useState<"shallow" | "medium" | "deep">("medium");
  const [widthCategory, setWidthCategory] = useState<"small" | "moderate" | "large">("moderate");

  // GPS Sensor state
  const [latitude, setLatitude] = useState(BORONGAN_CENTER.latitude);
  const [longitude, setLongitude] = useState(BORONGAN_CENTER.longitude);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [isWithinBounds, setIsWithinBounds] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);

  // Automated severity calculation (Objective 3 & Scope 4)
  const assessment = useMemo(() => {
    return classifyMobileDamage({
      damageType,
      roadName: roadName || "Real Street",
      barangay,
      title: title || "Road defect",
      description,
      depthCategory,
      widthCategory,
    });
  }, [damageType, roadName, barangay, title, description, depthCategory, widthCategory]);

  const fetchGPS = async () => {
    setLocating(true);
    try {
      const res = await requestAndGetGPSLocation();
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      setAccuracy(res.accuracy);
      setIsWithinBounds(res.isWithinBorongan);

      if (!res.isWithinBorongan) {
        Alert.alert(
          "Out of Jurisdiction",
          "Acquired GPS coordinates are outside Borongan City limits. Routine road reports are strictly limited to Borongan City (Limitation 7).",
        );
      }
    } catch (err: any) {
      Alert.alert("GPS Error", err.message || "Could not acquire location fix.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    fetchGPS();
  }, []);

  const takePhotoWithCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Camera access is needed to capture photographic evidence.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0].uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const pickPhotoFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0].uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert("Photo Required", "Photographic proof of the road damage is required (Scope 1).");
      return;
    }
    if (!title.trim() || !roadName.trim()) {
      Alert.alert("Missing Details", "Please fill in the incident title and road name.");
      return;
    }
    if (!verifyCoordinates(latitude, longitude)) {
      Alert.alert(
        "Invalid Location",
        "The coordinates are outside Borongan City jurisdiction. The system only handles routine defects in Borongan (Limitation 7).",
      );
      return;
    }

    setSubmitting(true);
    setUploadStep("Connecting to server backend...");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Authentication Needed", "Please log in to submit a verified report.");
        navigation.navigate("Auth");
        return;
      }

      setUploadStep("Uploading photo evidence...");

      // Prepare file upload
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const filename = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("damage-photos")
        .upload(filename, blob, { contentType: "image/jpeg" });

      if (uploadError) {
        throw new Error(
          `Photo upload session failed: ${uploadError.message}. Per Limitation 6, stable network is required.`,
        );
      }

      setUploadStep("Storing incident metadata & automated classification...");

      const { data, error: insertError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          road_name: roadName.trim(),
          barangay,
          damage_type: damageType,
          severity_level: assessment.severityLevel,
          photo_url: filename,
          latitude,
          longitude,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      Alert.alert(
        "Report Submitted!",
        `Incident logged with ${assessment.severityLevel.toUpperCase()} severity (Score: ${assessment.score}/100). The City Engineering Office will review it systematically.`,
        [
          {
            text: "View Status Tracking",
            onPress: () => navigation.replace("ReportDetail", { reportId: data.id }),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Submission Interrupted",
        err.message || "Network interruption during upload. Please re-submit within a stable session (Limitation 6).",
      );
    } finally {
      setSubmitting(false);
      setUploadStep(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Disclaimer Box */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Routine Defects Solely for Borongan</Text>
        <Text style={styles.disclaimerText}>
          This system only records routine road defects (potholes, cracks, erosion). Bridge
          failures and non-road municipal works are excluded (Limitation 1 & 7).
        </Text>
      </View>

      {/* Photo Evidence Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeaderTitle}>1. Photographic Evidence (Required)</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderIcon}>📸</Text>
            <Text style={styles.placeholderText}>No photo selected yet</Text>
          </View>
        )}
        <View style={styles.photoButtonsRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhotoWithCamera}>
            <Text style={styles.photoBtnText}>Take Camera Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, styles.photoBtnSecondary]}
            onPress={pickPhotoFromGallery}
          >
            <Text style={[styles.photoBtnText, styles.photoBtnTextSecondary]}>Choose Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GPS Location Sensor */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>2. Smartphone GPS Hardware (Scope 2)</Text>
          <TouchableOpacity onPress={fetchGPS} disabled={locating}>
            <Text style={styles.refreshGPSText}>{locating ? "Acquiring..." : "Refresh GPS"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gpsGrid}>
          <View style={styles.gpsItem}>
            <Text style={styles.gpsLabel}>Latitude</Text>
            <Text style={styles.gpsVal}>{latitude.toFixed(6)}° N</Text>
          </View>
          <View style={styles.gpsItem}>
            <Text style={styles.gpsLabel}>Longitude</Text>
            <Text style={styles.gpsVal}>{longitude.toFixed(6)}° E</Text>
          </View>
          <View style={styles.gpsItem}>
            <Text style={styles.gpsLabel}>Sensor Accuracy</Text>
            <Text style={styles.gpsVal}>{accuracy ? `±${Math.round(accuracy)} m` : "Verified"}</Text>
          </View>
          <View style={styles.gpsItem}>
            <Text style={styles.gpsLabel}>Jurisdiction</Text>
            <Text style={[styles.gpsVal, { color: isWithinBounds ? "#16a34a" : "#dc2626" }]}>
              {isWithinBounds ? "Borongan City ✓" : "Out of Bounds ✗"}
            </Text>
          </View>
        </View>

        {/* Real Google Satellite GIS Map */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
            🛰️ Satellite GIS Pinpoint (Tap map or drag pin to adjust):
          </Text>
          <GoogleSatelliteMap
            latitude={latitude}
            longitude={longitude}
            zoom={16}
            selectable={true}
            height={220}
            onLocationSelect={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
              setIsWithinBounds(verifyCoordinates(lat, lng));
            }}
          />
        </View>
      </View>

      {/* Defect Details & Classification */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeaderTitle}>3. Incident & Location Details</Text>

        <Text style={styles.inputLabel}>Hazard Title *</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Sharp pothole near school crossing"
        />

        <Text style={styles.inputLabel}>Road / Street Name *</Text>
        <TextInput
          style={styles.textInput}
          value={roadName}
          onChangeText={setRoadName}
          placeholder="e.g. Real Street or Samar East Coastal Rd"
        />

        <Text style={styles.inputLabel}>Barangay (Borongan City)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {BARANGAYS.slice(0, 15).map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.pillBtn, barangay === b && styles.pillBtnActive]}
              onPress={() => setBarangay(b)}
            >
              <Text style={[styles.pillText, barangay === b && styles.pillTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Damage Type</Text>
        <View style={styles.damageTypeGrid}>
          {DAMAGE_TYPES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.damageTypeBtn, damageType === d.key && styles.damageTypeBtnActive]}
              onPress={() => setDamageType(d.key)}
            >
              <Text
                style={[
                  styles.damageTypeText,
                  damageType === d.key && styles.damageTypeTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dimensionsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Depth</Text>
            <View style={styles.dimBtnGroup}>
              {(["shallow", "medium", "deep"] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.dimBtn, depthCategory === lvl && styles.dimBtnActive]}
                  onPress={() => setDepthCategory(lvl)}
                >
                  <Text style={styles.dimBtnText}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.inputLabel}>Width</Text>
            <View style={styles.dimBtnGroup}>
              {(["small", "moderate", "large"] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.dimBtn, widthCategory === lvl && styles.dimBtnActive]}
                  onPress={() => setWidthCategory(lvl)}
                >
                  <Text style={styles.dimBtnText}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>Description & Hazard Risk (Optional)</Text>
        <TextInput
          style={[styles.textInput, { height: 70, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Mention accident risk, water ponding, or night visibility..."
        />
      </View>

      {/* Automated Severity Classification Preview (Objective 3) */}
      <View style={styles.automatedCard}>
        <View style={styles.automatedHeader}>
          <Text style={styles.automatedTitle}>⚡ Automated Data Processing (Objective 3)</Text>
          <View style={[styles.severityBadge, { backgroundColor: assessment.color }]}>
            <Text style={styles.severityBadgeText}>{assessment.severityLevel.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.automatedScoreText}>
          Composite Score: <Text style={{ fontWeight: "800" }}>{assessment.score}/100</Text>
        </Text>
        <Text style={styles.automatedRationale}>{assessment.rationale}</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!isWithinBounds || submitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !isWithinBounds}
      >
        {submitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.submitButtonText}> {uploadStep || "Uploading..."}</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Submit Verified Road Report</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingTop: 16 },
  disclaimerBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 14,
  },
  disclaimerTitle: { color: "#1e40af", fontSize: 12, fontWeight: "700" },
  disclaimerText: { color: "#475569", fontSize: 11, marginTop: 2, lineHeight: 16 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 10 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshGPSText: { fontSize: 12, color: "#2563eb", fontWeight: "600" },
  photoPreview: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },
  photoPlaceholder: {
    height: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  placeholderIcon: { fontSize: 32 },
  placeholderText: { fontSize: 12, color: "#64748b", marginTop: 4 },
  photoButtonsRow: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  photoBtnSecondary: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1" },
  photoBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  photoBtnTextSecondary: { color: "#334155" },
  gpsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  gpsItem: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  gpsLabel: { fontSize: 10, color: "#64748b" },
  gpsVal: { fontSize: 12, fontWeight: "700", color: "#0f172a", marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#334155", marginTop: 10, marginBottom: 4 },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  pillScroll: { marginVertical: 6 },
  pillBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
  },
  pillBtnActive: { backgroundColor: "#2563eb" },
  pillText: { fontSize: 11, color: "#475569", fontWeight: "600" },
  pillTextActive: { color: "#ffffff" },
  damageTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  damageTypeBtn: {
    width: "48%",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  damageTypeBtnActive: { backgroundColor: "#eff6ff", borderColor: "#2563eb" },
  damageTypeText: { fontSize: 11, color: "#334155", fontWeight: "600" },
  damageTypeTextActive: { color: "#2563eb", fontWeight: "700" },
  dimensionsRow: { flexDirection: "row", marginTop: 4 },
  dimBtnGroup: { flexDirection: "row", gap: 4 },
  dimBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  dimBtnActive: { backgroundColor: "#2563eb" },
  dimBtnText: { fontSize: 10, color: "#334155", fontWeight: "600", textTransform: "capitalize" },
  automatedCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 14,
  },
  automatedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  automatedTitle: { fontSize: 12, fontWeight: "700", color: "#166534" },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityBadgeText: { color: "#ffffff", fontSize: 10, fontWeight: "800" },
  automatedScoreText: { fontSize: 12, color: "#15803d", marginTop: 4 },
  automatedRationale: { fontSize: 11, color: "#166534", marginTop: 4, lineHeight: 16 },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8" },
  submitButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  submittingRow: { flexDirection: "row", alignItems: "center" },
});
