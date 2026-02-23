import { useState, useRef, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const initialUrl = Linking.useURL();
  useEffect(() => {
    if (initialUrl) {
      createSessionFromUrl(initialUrl).catch((e) => {
        if (__DEV__) console.warn("[Auth] createSessionFromUrl:", e);
        Alert.alert("Error", e instanceof Error ? e.message : "Error al iniciar sesión");
      });
    }
  }, [initialUrl]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", (e) => {
      createSessionFromUrl(e.url).catch((err) => {
        if (__DEV__) console.warn("[Auth] createSessionFromUrl:", err);
        Alert.alert("Error", err instanceof Error ? err.message : "Error al iniciar sesión");
      });
    });
    return () => sub.remove();
  }, []);

  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { code, access_token, refresh_token, error: oauthError } = params;
    if (oauthError) throw new Error(params.error_description ?? oauthError);
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (access_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? "" });
      if (error) throw error;
    }
  };

  const signInWithGoogle = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://watchily-ho.vercel.app";
    const appRedirect = makeRedirectUri({ path: "auth/callback" });
    const redirectTo = `${apiUrl}/auth/mobile-callback?app_redirect=${encodeURIComponent(appRedirect)}`;
    if (__DEV__) console.log("[Auth] Redirect URL:", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (!data?.url) return;
    Linking.openURL(data.url);
  };

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
  };

  const signUp = async () => {
    setLoading(true);
    const redirectTo = makeRedirectUri({ path: "auth/callback" });
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Listo", "Revisa tu correo para confirmar.");
  };

  return (
    <GradientBackground>
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.title}>Watchily</Text>
      <TouchableOpacity style={styles.button} onPress={signInWithGoogle} disabled={loading} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Continuar con Google</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.mutedForeground}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={theme.colors.mutedForeground}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={signUp} disabled={loading} activeOpacity={0.85}>
        <Text style={styles.secondaryButtonText}>Registrarse</Text>
      </TouchableOpacity>
    </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: theme.colors.foreground, textAlign: "center", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: 12,
    color: theme.colors.foreground,
    marginBottom: 12,
  },
  button: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radii.md, marginBottom: 12 },
  secondary: { backgroundColor: theme.colors.secondary },
  buttonText: { color: theme.colors.primaryForeground, textAlign: "center", fontWeight: "600" },
  secondaryButtonText: { color: theme.colors.secondaryForeground, textAlign: "center", fontWeight: "600" },
});
