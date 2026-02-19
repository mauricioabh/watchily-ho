import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import * as Linking from "expo-linking";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectUrl = Linking.createURL("auth/callback");

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) Alert.alert("Error", error.message);
    else if (data?.url) Linking.openURL(data.url);
  };

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
  };

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Listo", "Revisa tu correo para confirmar.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchily</Text>
      <TouchableOpacity style={styles.button} onPress={signInWithGoogle} disabled={loading}>
        <Text style={styles.buttonText}>Continuar con Google</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={signUp} disabled={loading}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#0a0a0a" },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 12,
  },
  button: { backgroundColor: "#e5b00b", padding: 14, borderRadius: 8, marginBottom: 12 },
  secondary: { backgroundColor: "#333" },
  buttonText: { color: "#000", textAlign: "center", fontWeight: "600" },
});
