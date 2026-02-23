import { useState, useRef, useEffect } from "react";
import {
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  useWindowDimensions,
} from "react-native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { TitleCard, type MobileTitle } from "../components/TitleCard";

const NUM_COLUMNS = 2;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MobileTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tileWidth =
    (width - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    api.titles
      .search(query.trim())
      .then((r) => setResults(
        (r.titles as MobileTitle[]).filter((t) => t.poster?.startsWith("http"))
      ))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Películas o series..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={search}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{loading ? "…" : "Buscar"}</Text>
          </TouchableOpacity>
        </View>

        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TitleCard title={item} width={tileWidth} />
            )}
          />
        )}

        {!loading && results.length === 0 && query.trim().length > 0 && (
          <Text style={styles.emptyText}>Sin resultados en tus plataformas.</Text>
        )}
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    justifyContent: "center",
  },
  buttonText: { color: theme.colors.primaryForeground, fontWeight: "700", fontSize: 14 },
  row: { justifyContent: "space-between" },
  listContent: { paddingBottom: 24 },
  emptyText: {
    color: theme.colors.mutedForeground,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
});
