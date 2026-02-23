import { useEffect, useState, useRef } from "react";
import { Text, View, StyleSheet, Animated, useWindowDimensions, FlatList } from "react-native";
import { useRoute } from "@react-navigation/native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { TitleCard, type MobileTitle } from "../components/TitleCard";

const NUM_COLUMNS = 2;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

export function ListDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params as { id: string; name: string };
  const [titles, setTitles] = useState<MobileTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tileWidth = (width - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  useEffect(() => {
    // Fetch list items then enrich with title details (uses auth via fetchApi)
    api.lists
      .getItems(id)
      .then(async ({ items: itemsList }) => {
        const items: { title_id: string; title_type: string }[] = itemsList ?? [];
        const details = await Promise.allSettled(
          items.map((item) => api.titles.get(item.title_id).catch(() => null))
        );
        const loaded = details
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => (r as PromiseFulfilledResult<any>).value as MobileTitle)
          .filter((t) => t.poster?.startsWith("http")); // only with poster
        setTitles(loaded);
      })
      .catch(() => setTitles([]))
      .finally(() => {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
  }, [id, fadeAnim]);

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {loading ? (
          <Text style={styles.muted}>Cargando títulos...</Text>
        ) : titles.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Esta lista está vacía.</Text>
            <Text style={styles.muted}>Agrega títulos desde los tiles de búsqueda o popular.</Text>
          </View>
        ) : (
          <FlatList
            data={titles}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <TitleCard title={item} width={tileWidth} />}
          />
        )}
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 },
  row: { justifyContent: "space-between" },
  listContent: { paddingBottom: 24 },
  muted: { color: theme.colors.mutedForeground, fontSize: 13, textAlign: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
  emptyText: { color: theme.colors.foreground, fontSize: 16, fontWeight: "600" },
});
