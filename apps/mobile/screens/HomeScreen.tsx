import { useEffect, useState, useRef, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, StyleSheet, Animated, useWindowDimensions, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { TitleCard, type MobileTitle } from "../components/TitleCard";

const NUM_COLUMNS = 2;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

export function HomeScreen() {
  const [titles, setTitles] = useState<MobileTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tileWidth =
    (width - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const cancelledRef = useRef(false);

  const loadPopular = useCallback((isRefresh = false) => {
    cancelledRef.current = false;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const SAFETY_TIMEOUT_MS = 25_000;
    const safetyTimer = setTimeout(() => {
      if (!cancelledRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }, SAFETY_TIMEOUT_MS);

    api.titles
      .popular("movie")
      .then((r) => {
        if (cancelledRef.current) return;
        setError(false);
        const withPoster = (r.titles as MobileTitle[]).filter(
          (t) => t.poster?.startsWith("http")
        );
        setTitles(withPoster);
      })
      .catch(() => {
        if (!cancelledRef.current) {
          setTitles([]);
          setError(true);
        }
      })
      .finally(() => {
        cancelledRef.current = true;
        clearTimeout(safetyTimer);
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadPopular();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadPopular]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header row */}
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Popular</Text>
          <TouchableOpacity
            style={styles.verTodoBtn}
            onPress={() => navigation.navigate("AllTitles")}
            activeOpacity={0.8}
          >
            <Text style={styles.verTodoText}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.muted}>Cargando...</Text>
        ) : titles.length === 0 ? (
          <ScrollView
            contentContainerStyle={[styles.emptyContent, { minHeight: height }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadPopular(true)}
                tintColor="#fbbf24"
                colors={["#fbbf24"]}
              />
            }
          >
            <Text style={[styles.muted, styles.emptyText]}>
              {error
                ? "Error al cargar."
                : "No hay títulos disponibles en tus plataformas."}
            </Text>
            {error && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadPopular(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={titles}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadPopular(true)}
                tintColor="#fbbf24"
                colors={["#fbbf24"]}
              />
            }
            renderItem={({ item }) => (
              <TitleCard title={item} width={tileWidth} />
            )}
          />
        )}
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.foreground },
  verTodoBtn: {
    backgroundColor: "rgba(245,158,11,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.45)",
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  verTodoText: { color: "#fbbf24", fontSize: 13, fontWeight: "700" },
  row: { justifyContent: "space-between" },
  listContent: { paddingBottom: 24 },
  emptyContent: { flexGrow: 1, paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  retryBtn: {
    marginTop: 16,
    alignSelf: "center",
    backgroundColor: "rgba(245,158,11,0.25)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  retryBtnText: { color: "#fbbf24", fontWeight: "600", fontSize: 15 },
  muted: { color: theme.colors.mutedForeground, fontSize: 13 },
  emptyText: { textAlign: "center" },
});
