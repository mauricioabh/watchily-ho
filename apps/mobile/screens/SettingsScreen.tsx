import { useRef, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";

export function SettingsScreen() {
  const signOut = () => supabase.auth.signOut();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <GradientBackground>
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      <Text style={styles.muted}>Proveedores y país: configúralos en la web.</Text>
      <TouchableOpacity style={styles.button} onPress={signOut} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: theme.colors.foreground, marginBottom: 16 },
  muted: { color: theme.colors.mutedForeground, marginBottom: 24 },
  button: { backgroundColor: theme.colors.secondary, padding: 14, borderRadius: theme.radii.md },
  buttonText: { color: theme.colors.foreground, textAlign: "center", fontWeight: "600" },
});
