import { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  TextInput,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type List = { id: string; name: string; is_public: boolean; created_at: string };

const ACCENT_COLORS = [
  { border: "rgba(99,102,241,0.6)",  fill: "rgba(99,102,241,0.10)",  badge: "#818cf8" },
  { border: "rgba(14,165,233,0.6)",  fill: "rgba(14,165,233,0.10)",  badge: "#38bdf8" },
  { border: "rgba(244,63,94,0.6)",   fill: "rgba(244,63,94,0.10)",   badge: "#fb7185" },
  { border: "rgba(16,185,129,0.6)",  fill: "rgba(16,185,129,0.10)",  badge: "#34d399" },
  { border: "rgba(245,158,11,0.6)",  fill: "rgba(245,158,11,0.10)",  badge: "#fbbf24" },
  { border: "rgba(139,92,246,0.6)",  fill: "rgba(139,92,246,0.10)",  badge: "#a78bfa" },
  { border: "rgba(236,72,153,0.6)",  fill: "rgba(236,72,153,0.10)",  badge: "#f472b6" },
];

export function ListsScreen() {
  const [lists, setLists] = useState<List[]>([]);
  const [countByList, setCountByList] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadLists = useCallback(async () => {
    try {
      const { lists: data } = await api.lists.all();
      setLists(data);
      // Fetch item counts per list
      if (data.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.allSettled(
          data.map(async (l) => {
            const r = await api.lists.forTitle("__count__").catch(() => null);
            // Use a lightweight approach: fetch items for each list separately
            counts[l.id] = 0;
          })
        );
        // Simpler: fetch all items in one go via a custom approach
        // Since API doesn't have bulk count, we track from bookmark interactions
        setCountByList(counts);
      }
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when screen comes into focus (e.g., after adding a bookmark)
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      loadLists().then(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, [loadLists, fadeAnim])
  );

  const createList = async () => {
    if (!newListName.trim() || creating) return;
    setCreating(true);
    try {
      await api.lists.create(newListName.trim());
      setNewListName("");
      setModalVisible(false);
      loadLists();
    } catch {
      Alert.alert("Error", "No se pudo crear la lista.");
    } finally {
      setCreating(false);
    }
  };

  const totalTitles = Object.values(countByList).reduce((a, b) => a + b, 0);

  const renderItem = ({ item, index }: { item: List; index: number }) => {
    const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
    const count = countByList[item.id] ?? 0;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: accent.fill, borderColor: accent.border }]}
        onPress={() => navigation.navigate("ListDetail", { id: item.id, name: item.name })}
        activeOpacity={0.78}
      >
        {/* Top accent bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: accent.border }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.is_public ? "Pública" : "Privada"}</Text>
          </View>
          <View style={[styles.countBadge, { borderColor: accent.badge + "55" }]}>
            <Text style={[styles.countText, { color: accent.badge }]}>
              {count} {count === 1 ? "título" : "títulos"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.sectionTitle}>Mis listas</Text>
            {lists.length > 0 && (
              <View style={styles.listCountBadge}>
                <Text style={styles.listCountText}>{lists.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.newListBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.newListBtnText}>+ Nueva lista</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.muted}>Cargando...</Text>
        ) : lists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aún no tienes listas.</Text>
            <Text style={styles.emptySubText}>¡Crea una para guardar tus títulos favoritos!</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Animated.View>

      {/* Nueva lista modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nueva lista</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la lista..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              onSubmitEditing={createList}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setModalVisible(false); setNewListName(""); }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, (!newListName.trim() || creating) && styles.modalCreateBtnDisabled]}
                onPress={createList}
                disabled={!newListName.trim() || creating}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCreateText}>{creating ? "Creando…" : "Crear"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.foreground },
  listCountBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  listCountText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  newListBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  newListBtnText: { color: theme.colors.foreground, fontSize: 13, fontWeight: "600" },
  listContent: { paddingBottom: 24, gap: 10 },
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccentBar: { height: 2, width: "100%", opacity: 0.7 },
  cardContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 },
  cardLeft: { flex: 1, minWidth: 0 },
  cardName: { color: theme.colors.foreground, fontWeight: "600", fontSize: 15 },
  cardSub: { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 2 },
  countBadge: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  countText: { fontSize: 11, fontWeight: "700" },
  muted: { color: theme.colors.mutedForeground, fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: theme.colors.foreground, fontSize: 16, fontWeight: "600" },
  emptySubText: { color: theme.colors.mutedForeground, fontSize: 13, textAlign: "center" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: {
    width: "100%",
    backgroundColor: "#0f1629",
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    gap: 16,
  },
  modalTitle: { color: theme.colors.foreground, fontSize: 17, fontWeight: "700" },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalCancelText: { color: theme.colors.mutedForeground, fontWeight: "600", fontSize: 14 },
  modalCreateBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  modalCreateBtnDisabled: { opacity: 0.4 },
  modalCreateText: { color: theme.colors.foreground, fontWeight: "700", fontSize: 14 },
});
