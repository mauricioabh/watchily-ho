import {
  Image,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "../theme";
import { api } from "../lib/api";

export type MobileTitle = {
  id: string;
  name: string;
  type?: string;
  year?: number;
  poster?: string;
  imdbRating?: number;
  criticScore?: number;
  userRating?: number;
  sources?: Array<{ providerName: string; type: string; url?: string }>;
};

/* ── Platform color map ── */
const PLATFORM_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  netflix:     { label: "N",   color: "#E50914", bg: "#E5091422" },
  disney:      { label: "D+",  color: "#113CCF", bg: "#113CCF22" },
  hbo:         { label: "HBO", color: "#B535F6", bg: "#B535F622" },
  max:         { label: "Max", color: "#B535F6", bg: "#B535F622" },
  prime:       { label: "P",   color: "#00A8E1", bg: "#00A8E122" },
  amazon:      { label: "P",   color: "#00A8E1", bg: "#00A8E122" },
  apple:       { label: "A",   color: "#CCCCCC", bg: "#CCCCCC22" },
  paramount:   { label: "P+",  color: "#0064FF", bg: "#0064FF22" },
  crunchyroll: { label: "CR",  color: "#F47521", bg: "#F4752122" },
};

function getPlatformStyle(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return { label: name.slice(0, 2).toUpperCase(), color: "#888888", bg: "#88888822" };
}

function getSubSources(sources: MobileTitle["sources"]) {
  const seen = new Set<string>();
  return (sources ?? []).filter((s) => {
    if (s.type !== "sub") return false;
    const key = s.providerName.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Bookmark button + modal (like web) ── */
function BookmarkButton({ title }: { title: MobileTitle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [listIds, setListIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  const refreshLists = () => {
    api.lists.forTitle(title.id).then((d) => {
      const ids = d.listIdsByTitle?.[title.id] ?? [];
      setListIds(ids);
      setBookmarked(ids.length > 0);
    }).catch(() => {});
  };

  useEffect(() => {
    refreshLists();
  }, [title.id]);

  useEffect(() => {
    if (!modalVisible) return;
    api.lists.all().then(({ lists: data }) => setLists(data)).catch(() => setLists([]));
  }, [modalVisible]);

  const handlePress = () => {
    if (loading) return;
    setModalVisible(true);
  };

  const addToList = async (listId: string) => {
    try {
      await api.lists.addItem(listId, title.id, title.type ?? "movie");
      setListIds((prev) => (prev.includes(listId) ? prev : [...prev, listId]));
      setBookmarked(true);
    } catch {}
  };

  const removeFromList = async (listId: string) => {
    try {
      await api.lists.removeItem(listId, title.id);
      setListIds((prev) => prev.filter((id) => id !== listId));
      setBookmarked(listIds.length > 1);
    } catch {}
  };

  const createListAndAdd = async () => {
    if (!newListName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await api.lists.create(newListName.trim());
      await addToList(created.id);
      setLists((prev) => [...prev, { id: created.id, name: created.name }]);
      setNewListName("");
    } catch {
      Alert.alert("Error", "No se pudo crear la lista.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
        onPress={handlePress}
        activeOpacity={0.75}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.bookmarkIcon}>{bookmarked ? "🔖" : "🏷️"}</Text>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Añadir a lista</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>{title.name}</Text>

            {lists.length === 0 ? (
              <Text style={styles.modalHint}>Aún no tienes listas. Crea una abajo.</Text>
            ) : (
              <ScrollView style={styles.modalListScroll} showsVerticalScrollIndicator={false}>
                {lists.map((list) => {
                  const inList = listIds.includes(list.id);
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={styles.modalListRow}
                      onPress={() => (inList ? removeFromList(list.id) : addToList(list.id))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, inList && styles.checkboxChecked]}>
                        {inList && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.modalListName} numberOfLines={1}>{list.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalCreateRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="Nueva lista"
                placeholderTextColor={theme.colors.mutedForeground}
                value={newListName}
                onChangeText={setNewListName}
                onSubmitEditing={createListAndAdd}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.modalCreateBtn, (!newListName.trim() || creating) && styles.modalCreateBtnDisabled]}
                onPress={createListAndAdd}
                disabled={!newListName.trim() || creating}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCreateBtnText}>
                  {creating ? "Creando…" : "Crear y añadir"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ── Main card ── */
type Props = { title: MobileTitle; width?: number };

export function TitleCard({ title, width }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const subSources = getSubSources(title.sources);
  const firstSource = title.sources?.find((s) => s.url);
  const firstPlatformStyle = subSources.length > 0 ? getPlatformStyle(subSources[0].providerName) : null;
  const isWhiteBrand = firstPlatformStyle?.color === "#CCCCCC";
  const btnColor = isWhiteBrand ? "#2a2a2e" : (firstPlatformStyle?.color ?? theme.colors.primary);

  const cardStyle = width ? [styles.card, { width }] : styles.card;
  const isSeries = title.type === "series";

  return (
    <View style={cardStyle}>
      {/* Poster */}
      <TouchableOpacity
        style={styles.posterContainer}
        onPress={() => navigation.navigate("Title", { id: title.id })}
        activeOpacity={0.85}
      >
        {title.poster ? (
          <Image source={{ uri: title.poster }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.posterFallback}>
            <Text style={styles.posterFallbackText}>{title.name.slice(0, 2)}</Text>
          </View>
        )}

        {/* Type badge — top left */}
        <View style={[styles.typeBadge, isSeries ? styles.typeBadgeSeries : styles.typeBadgeMovie]}>
          <Text style={styles.typeText}>{isSeries ? "SERIE" : "PELÍCULA"}</Text>
        </View>

        {/* Year badge — bottom left */}
        {title.year != null && (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{title.year}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bookmark — top right over poster (outside TouchableOpacity to avoid nesting) */}
      <View style={styles.bookmarkWrapper} pointerEvents="box-none">
        <BookmarkButton title={title} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <TouchableOpacity onPress={() => navigation.navigate("Title", { id: title.id })} activeOpacity={0.7}>
          <Text style={styles.title} numberOfLines={1}>{title.name}</Text>
        </TouchableOpacity>

        {/* Platform badges — each links to that source */}
        {subSources.length > 0 && (
          <View style={styles.platforms}>
            {subSources.slice(0, 4).map((s, i) => {
              const p = getPlatformStyle(s.providerName);
              const badge = (
                <View
                  key={i}
                  style={[styles.platformBadge, { backgroundColor: p.bg, borderColor: p.color + "55" }]}
                >
                  <Text style={[styles.platformText, { color: p.color }]}>{p.label}</Text>
                </View>
              );
              return s.url ? (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url!)} activeOpacity={0.7}>
                  {badge}
                </TouchableOpacity>
              ) : badge;
            })}
          </View>
        )}

        {/* Ver ahora */}
        {firstSource?.url && (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: btnColor }]}
            onPress={() => Linking.openURL(firstSource.url!)}
            activeOpacity={0.82}
          >
            <Text style={styles.playText}>▶  Ver ahora</Text>
            {firstPlatformStyle && (
              <Text style={[styles.playPlatformLabel, { color: isWhiteBrand ? "#aaa" : firstPlatformStyle.color + "cc" }]}>
                {firstPlatformStyle.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  posterContainer: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: theme.colors.muted,
  },
  poster: { width: "100%", height: "100%" },
  posterFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  posterFallbackText: { color: theme.colors.mutedForeground, fontSize: 22, fontWeight: "bold" },
  typeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeSeries: { backgroundColor: theme.colors.primary },
  typeBadgeMovie:  { backgroundColor: "rgba(0,0,0,0.62)" },
  typeText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  yearBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  yearText: { color: "rgba(255,255,255,0.8)", fontSize: 10 },
  bookmarkWrapper: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
  },
  bookmarkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  bookmarkBtnActive: {
    backgroundColor: "rgba(99,102,241,0.35)",
    borderColor: "rgba(99,102,241,0.6)",
  },
  bookmarkIcon: { fontSize: 13 },
  info: { padding: 10, gap: 6 },
  title: { color: theme.colors.foreground, fontWeight: "600", fontSize: 13, lineHeight: 17 },
  platforms: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  // Bookmark modal
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
  modalSubtitle: { color: theme.colors.mutedForeground, fontSize: 13 },
  modalHint: { color: theme.colors.mutedForeground, fontSize: 13 },
  modalListScroll: { maxHeight: 180 },
  modalListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  modalListName: { flex: 1, color: theme.colors.foreground, fontSize: 14 },
  modalCreateRow: { flexDirection: "row", gap: 8 },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  modalCreateBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    justifyContent: "center",
  },
  modalCreateBtnDisabled: { opacity: 0.5 },
  modalCreateBtnText: { color: theme.colors.primaryForeground, fontSize: 13, fontWeight: "600" },
  modalCloseBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  modalCloseText: { color: theme.colors.mutedForeground, fontSize: 14, fontWeight: "600" },
  platformBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 30,
    alignItems: "center",
  },
  platformText: { fontSize: 10, fontWeight: "700" },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 2,
    gap: 6,
  },
  playText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  playPlatformLabel: { fontSize: 11, fontWeight: "700", marginLeft: "auto" },
});
