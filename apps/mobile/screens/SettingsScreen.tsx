import { useRef, useEffect, useState, useCallback } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  View,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SimpleIcon } from "../components/SimpleIcon";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";

// Simple Icons CDN. Disney+ no existe → fallback. Prime Video → amazonprime.
const PROVIDERS = [
  { id: "netflix", name: "Netflix", slug: "netflix", color: "#E50914", fallback: false },
  { id: "disney_plus", name: "Disney+", slug: "disneyplus", color: "#113CCF", fallback: true },
  { id: "hbo_max", name: "HBO Max", slug: "hbomax", color: "#B535F6", fallback: false },
  { id: "amazon_prime", name: "Amazon Prime Video", slug: "amazonprime", color: "#00A8E1", fallback: true },
  { id: "apple_tv_plus", name: "Apple TV+", slug: "appletv", color: "#FFFFFF", fallback: false },
  { id: "paramount_plus", name: "Paramount+", slug: "paramountplus", color: "#0064FF", fallback: false },
  { id: "crunchyroll", name: "Crunchyroll", slug: "crunchyroll", color: "#F47521", fallback: false },
] as const;

const COUNTRIES = [
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "BR", name: "Brasil" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemania" },
  { code: "FR", name: "Francia" },
];

export function SettingsScreen() {
  const [country, setCountry] = useState("MX");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    await loadSettings(0);
    setRefreshing(false);
  }, [loadSettings]);

  const loadSettings = useCallback(async (retryCount = 0) => {
    try {
      // Asegurar sesión válida antes de llamar a la API (evita getSession() null en mobile)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && retryCount < 2) {
        await new Promise((r) => setTimeout(r, 300));
        return loadSettings(retryCount + 1);
      }
      if (!session) {
        setCountry("MX");
        setSelectedIds(new Set());
        return;
      }
      const [profileRes, providersRes] = await Promise.all([
        api.profile.get(),
        api.profileProviders.get(),
      ]);
      setCountry(profileRes.country_code ?? "MX");
      setSelectedIds(new Set(providersRes.selectedIds ?? []));
    } catch (e) {
      if (__DEV__) console.warn("[Settings] loadSettings error:", e);
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 500));
        return loadSettings(retryCount + 1);
      }
      setCountry("MX");
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const toggleProvider = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        api.profile.update({ country_code: country }),
        api.profileProviders.update(Array.from(selectedIds)),
      ]);
      setSaved(true);
    } catch {
      // Silent fail for now
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    setSignOutModalVisible(false);
    supabase.auth.signOut();
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.muted}>Cargando configuración…</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Text style={styles.sectionTitle}>Configuración</Text>

          {/* País */}
          <Text style={styles.label}>País (para disponibilidad de streaming)</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={country}
              onValueChange={setCountry}
              style={styles.picker}
              dropdownIconColor={theme.colors.mutedForeground}
              itemStyle={Platform.OS === "ios" ? { color: theme.colors.foreground, fontSize: 16 } : undefined}
              mode="dropdown"
              prompt="Selecciona tu país"
            >
              {COUNTRIES.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.code} color={theme.colors.foreground} />
              ))}
            </Picker>
          </View>

          {/* Proveedores */}
          <Text style={styles.label}>Proveedores (plataformas que tienes)</Text>
          <Text style={styles.hint}>
            Selecciona las plataformas a las que estás suscrito para ver dónde puedes ver cada título.
          </Text>
          <View style={styles.providersRow}>
            {PROVIDERS.map((p) => {
              const isSelected = selectedIds.has(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.providerChip,
                    isSelected && styles.providerChipSelected,
                    isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "20" },
                  ]}
                  onPress={() => toggleProvider(p.id)}
                  activeOpacity={0.8}
                >
                  <SimpleIcon
                    name={p.slug}
                    color={isSelected ? theme.colors.primary : p.color}
                    size={20}
                    fallback={p.fallback}
                  />
                  <Text
                    style={[
                      styles.providerLabel,
                      isSelected && { color: theme.colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.saveBtnText}>Guardar</Text>
            )}
          </TouchableOpacity>
          {saved && <Text style={styles.savedText}>Guardado.</Text>}

          {/* Separador visual para evitar pulsar Cerrar sesión por error */}
          <View style={styles.logoutSpacer} />

          {/* Cerrar sesión */}
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setSignOutModalVisible(true)} activeOpacity={0.85}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.foreground} />
            <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Modal cerrar sesión (estilo bookmark) */}
      <Modal visible={signOutModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSignOutModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalSubtitle}>¿Estás seguro de que quieres cerrar sesión?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSignOutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmSignOut}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSignOutModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { justifyContent: "center", alignItems: "center", gap: 12 },
  scrollContent: { paddingBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: theme.colors.foreground, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground, marginBottom: 8 },
  hint: { fontSize: 13, color: theme.colors.mutedForeground, marginBottom: 12 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: theme.colors.input,
    minHeight: 56,
    justifyContent: "center",
    paddingVertical: 4,
  },
  picker: {
    color: theme.colors.foreground,
    height: Platform.OS === "ios" ? 180 : 56,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
  },
  providersRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
  },
  providerChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "20",
  },
  providerLabel: { fontSize: 13, fontWeight: "500", color: theme.colors.mutedForeground, maxWidth: 120 },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    alignItems: "center",
    marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: theme.colors.primaryForeground, fontWeight: "600", fontSize: 15 },
  savedText: { color: theme.colors.primary, fontSize: 13, marginBottom: 24, textAlign: "center" },
  logoutSpacer: { height: 32, marginBottom: 8 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  logoutBtnText: { color: theme.colors.foreground, fontWeight: "600", fontSize: 15 },
  // Modal cerrar sesión (estilo bookmark)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0f1629",
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    gap: 16,
  },
  modalTitle: { color: theme.colors.foreground, fontSize: 17, fontWeight: "700" },
  modalSubtitle: { color: theme.colors.mutedForeground, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCancelText: { color: theme.colors.mutedForeground, fontWeight: "600", fontSize: 14 },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: "center",
    backgroundColor: theme.colors.destructive,
  },
  modalConfirmText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalCloseBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  modalCloseText: { color: theme.colors.mutedForeground, fontSize: 14, fontWeight: "600" },
  muted: { color: theme.colors.mutedForeground, fontSize: 14 },
});
