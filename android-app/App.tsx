import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "./src/config/supabase";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ReportDamageScreen } from "./src/screens/ReportDamageScreen";
import { ReportDetailScreen } from "./src/screens/ReportDetailScreen";
import { MyReportsScreen } from "./src/screens/MyReportsScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { AuthScreen } from "./src/screens/AuthScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>("Home");
  const [screenParams, setScreenParams] = useState<any>({});
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigation = {
    navigate: (screenName: string, params?: any) => {
      setCurrentScreen(screenName);
      if (params) setScreenParams(params);
    },
    replace: (screenName: string, params?: any) => {
      setCurrentScreen(screenName);
      if (params) setScreenParams(params);
    },
    goBack: () => {
      setCurrentScreen("Home");
    },
  };

  // Loading state while checking user session
  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#002776" />
        <ActivityIndicator size="large" color="#ff8200" />
        <Text style={styles.loadingAppText}>Borongan RoadWatch...</Text>
      </View>
    );
  }

  // MANDATORY AUTHENTICATION GATE: Citizens must register/login first before accessing app
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#002776" />
        <AuthScreen
          navigation={navigation}
          onAuthenticated={(userSession: any) => setSession(userSession)}
        />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "ReportDamage":
        return <ReportDamageScreen navigation={navigation} />;
      case "ReportDetail":
        return <ReportDetailScreen route={{ params: screenParams }} navigation={navigation} />;
      case "MyReports":
        return <MyReportsScreen navigation={navigation} />;
      case "Map":
        return <MapScreen navigation={navigation} />;
      case "Home":
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002776" />

      {/* Top App Header if not on Home */}
      {currentScreen !== "Home" ? (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {currentScreen === "ReportDamage"
              ? "Report Damage"
              : currentScreen === "ReportDetail"
                ? "Report Progress"
                : currentScreen === "MyReports"
                  ? "My Reports"
                  : currentScreen === "Map"
                    ? "GIS Satellite Map"
                    : "Borongan RoadWatch"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      ) : null}

      {/* Main Screen Content */}
      <View style={styles.screenContent}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={[styles.navIcon, currentScreen === "Home" && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, currentScreen === "Home" && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("ReportDamage")}
        >
          <Text style={[styles.navIcon, currentScreen === "ReportDamage" && styles.navIconActive]}>➕</Text>
          <Text style={[styles.navLabel, currentScreen === "ReportDamage" && styles.navLabelActive]}>Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Map")}
        >
          <Text style={[styles.navIcon, currentScreen === "Map" && styles.navIconActive]}>🗺️</Text>
          <Text style={[styles.navLabel, currentScreen === "Map" && styles.navLabelActive]}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MyReports")}
        >
          <Text style={[styles.navIcon, currentScreen === "MyReports" && styles.navIconActive]}>📋</Text>
          <Text style={[styles.navLabel, currentScreen === "MyReports" && styles.navLabelActive]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={async () => {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn("SignOut error:", e);
            } finally {
              setSession(null);
              setCurrentScreen("Home");
            }
          }}
        >
          <Text style={styles.navIcon}>🚪</Text>
          <Text style={styles.navLabel}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#002776",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingAppText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  topBar: {
    height: 52,
    backgroundColor: "#002776",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  topBarTitle: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  screenContent: { flex: 1 },
  bottomNav: {
    height: 58,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navIcon: { fontSize: 18, color: "#64748b" },
  navIconActive: { transform: [{ scale: 1.1 }] },
  navLabel: { fontSize: 9, fontWeight: "600", color: "#64748b", marginTop: 2 },
  navLabelActive: { color: "#002776", fontWeight: "800" },
});
