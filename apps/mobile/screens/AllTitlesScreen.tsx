import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  SectionList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { TitleCard, type MobileTitle } from "../components/TitleCard";

const NUM_COLUMNS = 2;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

type Section = { id: string; title: string; data: MobileTitle[][] };

export function AllTitlesScreen() {
  const [sections, setSections] = useState<{ id: string; name: string; titles: MobileTitle[] }[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tileWidth = (width - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const loadAll = useCallback(async () => {
    try {
      const { lists } = await api.lists.all();
      if (!lists.length) { setSections([]); return; }

      const sectionsData = await Promise.all(
        lists.map(async (list) => {
          const { items } = await api.lists.getItems(list.id);
          const itemsList: { title_id: string; title_type: string }[] = items ?? [];
          const details = await Promise.allSettled(
            itemsList.map((item) => api.titles.get(item.title_id))
          );
          const titles = details
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => (r as PromiseFulfilledResult<any>).value as MobileTitle)
            .filter((t) => t.poster?.startsWith("http")); // only with poster
          return { id: list.id, name: list.name, titles };
        })
      );

      setSections(sectionsData.filter((s) => s.titles.length > 0));
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [fadeAnim]);

  useFocusEffect(useCallback(() => {
    fadeAnim.setValue(0);
    setLoading(true);
    loadAll();
  }, [loadAll, fadeAnim]));

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, titles: s.titles.filter((t) => t.name.toLowerCase().includes(q)) }))
      .filter((s) => s.titles.length > 0);
  }, [sections, query]);

  const totalUnique = useMemo(() => {
    const seen = new Set<string>();
    sections.forEach((s) => s.titles.forEach((t) => seen.add(t.id)));
    return seen.size;
  }, [sections]);

  // Chunk titles into rows of NUM_COLUMNS for SectionList
  function chunkTitles(titles: MobileTitle[]): MobileTitle[][] {
    const rows: MobileTitle[][] = [];
    for (let i = 0; i < titles.length; i += NUM_COLUMNS) {
      rows.push(titles.slice(i, i + NUM_COLUMNS));
    }
    return rows;
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.muted}>Cargando todos los títulos...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Todos mis títulos</Text>
          {totalUnique > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalUnique}</Text>
            </View>
          )}
        </View>

        {/* Search filter */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar por nombre..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn} activeOpacity={0.7}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredSections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query ? `Sin resultados para "${query}"` : "Tus listas están vacías."}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={filteredSections.map((s) => ({
              id: s.id,
              title: s.name,
              count: s.titles.length,
              data: chunkTitles(s.titles),
            }))}
            keyExtractor={(row, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {section.count} {section.count === 1 ? "título" : "títulos"}
                  </Text>
                </View>
                <View style={styles.sectionLine} />
              </View>
            )}
            renderItem={({ item: row }) => (
              <View style={styles.row}>
                {row.map((t) => (
                  <TitleCard key={t.id} title={t} width={tileWidth} />
                ))}
                {/* Filler if odd number in last row */}
                {row.length < NUM_COLUMNS && (
                  <View style={{ width: tileWidth }} />
                )}
              </View>
            )}
          />
        )}
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.foreground },
  totalBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  totalBadgeText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  clearBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  clearText: { color: theme.colors.mutedForeground, fontSize: 13 },
  listContent: { paddingBottom: 32 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
  sectionBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sectionBadgeText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600" },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center" },
  muted: { color: theme.colors.mutedForeground, fontSize: 13 },
});
