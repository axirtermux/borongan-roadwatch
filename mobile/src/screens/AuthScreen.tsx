import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { supabase } from "../config/supabase";

export function AuthScreen({
  navigation,
  onAuthenticated,
}: {
  navigation: any;
  onAuthenticated?: (session: any) => void;
}) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      Alert.alert("Required Fields", "Please enter both an email address and password.");
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name for municipal civic records.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            Alert.alert(
              "Email Verification Pending",
              "Supabase project has 'Confirm Email' enabled. Please check your inbox, or disable email confirmation in Supabase Auth Settings to allow instant sign in.",
              [
                {
                  text: "Enter with Citizen Session",
                  onPress: () => {
                    const fallbackSession = {
                      user: { id: "citizen-" + Date.now(), email: cleanEmail },
                    };
                    if (onAuthenticated) onAuthenticated(fallbackSession);
                    else navigation.replace("Home");
                  },
                },
                { text: "OK" },
              ]
            );
            return;
          }
          throw error;
        }

        if (data.session) {
          Alert.alert("Welcome Back", "Signed in successfully to Borongan RoadWatch.");
          if (onAuthenticated) onAuthenticated(data.session);
          else navigation.replace("Home");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          Alert.alert("Account Created", "Welcome to Borongan RoadWatch! You are now signed in.");
          if (onAuthenticated) onAuthenticated(data.session);
          else navigation.replace("Home");
        } else {
          Alert.alert(
            "Registration Successful!",
            "Account created! You may now sign in.",
            [
              {
                text: "Sign In Now",
                onPress: () => {
                  setIsLogin(true);
                },
              },
            ]
          );
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      Alert.alert("Authentication Failed", err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    const demoSession = {
      user: {
        id: "citizen-demo-juan",
        email: "juan.delacruz@borongan.gov.ph",
        user_metadata: { full_name: "Juan Dela Cruz", phone: "09123456789" },
      },
    };
    if (onAuthenticated) {
      onAuthenticated(demoSession);
    } else {
      navigation.replace("Home");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Header & Official DPWH Seal */}
          <View style={styles.headerRow}>
            <View style={styles.logoBadgeContainer}>
              <Image
                source={require("../../assets/dpwh-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.govTag}>CITY OF BORONGAN · DPWH</Text>
              <Text style={styles.appTitle}>RoadWatch Portal</Text>
            </View>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                1. Register First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                2. Citizen Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modeDescription}>
            {isLogin
              ? "Sign in to submit road damage reports and track repair status."
              : "Register first as a citizen reporter in Borongan City."}
          </Text>

          {/* Registration Fields */}
          {!isLogin ? (
            <>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Mobile Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="09123456789"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </>
          ) : null}

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="citizen@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password * (Min. 6 characters)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnText}>
                {isLogin ? "Sign In to RoadWatch →" : "Create Citizen Account →"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Demo Quick Sign-In Option */}
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleDemoSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.demoBtnText}>⚡ Instant Demo Citizen Access</Text>
          </TouchableOpacity>

          {/* Bottom Switch Link */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Register first here."
                : "Already registered? Sign in here."}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#002776" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  logoBadgeContainer: {
    width: 52,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  logo: { width: 46, height: 32 },
  headerTextCol: { flex: 1 },
  govTag: { fontSize: 9, fontWeight: "800", color: "#2563eb", letterSpacing: 0.6 },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#002776" },
  tabSwitch: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: "#002776",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  modeDescription: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 16,
  },
  label: { fontSize: 11, fontWeight: "700", color: "#334155", marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#0f172a",
  },
  btn: {
    backgroundColor: "#ff8200",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#ff8200",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  btnDisabled: { backgroundColor: "#94a3b8" },
  btnText: { color: "#ffffff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  demoBtn: {
    marginTop: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  demoBtnText: { color: "#002776", fontSize: 12, fontWeight: "700" },
  toggleBtn: { marginTop: 12, alignItems: "center", paddingVertical: 4 },
  toggleText: { color: "#2563eb", fontSize: 12, fontWeight: "700" },
});
