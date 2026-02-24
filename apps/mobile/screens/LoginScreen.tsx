import { useState, useRef, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SimpleIcon } from "../components/SimpleIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";

WebBrowser.maybeCompleteAuthSession();

const isPKCEError = (e: unknown) =>
  e instanceof Error && (e.name === "AuthPKCECodeVerifierMissingError" || e.message?.includes("PKCE code verifier"));

// Simple Icons CDN. Disney+ no existe en SI → fallback. Prime Video → amazonprime (logo Amazon Prime).
const PLATFORMS = [
  { name: "Netflix", slug: "netflix", color: "#E50914", fallback: false },
  { name: "Disney+", slug: "disneyplus", color: "#113CCF", fallback: true },
  { name: "Prime Video", slug: "amazonprime", color: "#00A8E1", fallback: true },
  { name: "HBO Max", slug: "hbomax", color: "#B535F6", fallback: false },
  { name: "Crunchyroll", slug: "crunchyroll", color: "#F47521", fallback: false },
  { name: "Apple TV", slug: "appletv", color: "#FFFFFF", fallback: false },
] as const;

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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
        if (!isPKCEError(e)) Alert.alert("Error", e instanceof Error ? e.message : "Error al iniciar sesión");
      });
    }
  }, [initialUrl]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", (e) => {
      createSessionFromUrl(e.url).catch((err) => {
        if (__DEV__) console.warn("[Auth] createSessionFromUrl:", err);
        if (!isPKCEError(err)) Alert.alert("Error", err instanceof Error ? err.message : "Error al iniciar sesión");
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
    setMessage(null);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://watchily-ho.vercel.app";
    const appRedirect = makeRedirectUri({ path: "auth/callback" });
    // Proxy: Supabase redirige a nuestra web, nosotros redirigimos a la app con el code.
    // Evita que Supabase redirija a la web (Site URL) en vez de la app.
    const redirectTo = `${apiUrl}/auth/mobile-callback?app_redirect=${encodeURIComponent(appRedirect)}`;
    if (__DEV__) console.log("[Auth] Redirect URL:", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    if (!data?.url) return;
    const res = await WebBrowser.openAuthSessionAsync(data.url, appRedirect);
    if (res.type === "success" && res.url) {
      try {
        await createSessionFromUrl(res.url);
      } catch (e) {
        if (__DEV__) console.warn("[Auth] createSessionFromUrl:", e);
        if (!isPKCEError(e)) Alert.alert("Error", e instanceof Error ? e.message : "Error al iniciar sesión");
      }
    }
  };

  const signInWithEmail = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
  };

  const signUp = async () => {
    setLoading(true);
    setMessage(null);
    const redirectTo = makeRedirectUri({ path: "auth/callback" });
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Revisa tu correo para confirmar." });
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Encuentra en qué plataforma ver cada título</Text>
          <View style={styles.heroPlatforms}>
            {PLATFORMS.map((p) => (
              <View key={p.name} style={styles.heroPlatformIcon}>
                <SimpleIcon name={p.slug} color={p.color} size={18} fallback={p.fallback} />
              </View>
            ))}
          </View>
        </View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="film" size={24} color={theme.colors.primary} />
              <Text style={styles.title}>Watchily</Text>
            </View>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={loading}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o con email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={theme.colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {message && (
              <Text
                style={[
                  styles.message,
                  message.type === "error" ? styles.messageError : styles.messageSuccess,
                ]}
              >
                {message.text}
              </Text>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={signInWithEmail}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={signUp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Registrarse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  hero: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.foreground,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: "center",
    alignSelf: "stretch",
  },
  heroPlatforms: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  heroPlatformIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.input,
    backgroundColor: theme.colors.background,
    padding: 14,
    borderRadius: theme.radii.md,
  },
  googleButtonText: {
    color: theme.colors.foreground,
    fontWeight: "600",
    fontSize: 15,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    textTransform: "uppercase",
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.input,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    padding: 12,
    color: theme.colors.foreground,
    fontSize: 16,
  },
  message: {
    fontSize: 14,
  },
  messageError: {
    color: theme.colors.destructive,
  },
  messageSuccess: {
    color: theme.colors.primary,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  secondaryButtonText: {
    color: theme.colors.secondaryForeground,
    fontWeight: "600",
    fontSize: 15,
  },
});
