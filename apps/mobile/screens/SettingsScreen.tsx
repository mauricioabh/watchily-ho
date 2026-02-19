import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export function SettingsScreen() {
  const signOut = () => supabase.auth.signOut();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      <Text style={styles.muted}>Proveedores y país: configúralos en la web.</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  muted: { color: "#888", marginBottom: 24 },
  button: { backgroundColor: "#333", padding: 14, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
