import { useEffect, useState, useRef } from "react";
import { Text, View, FlatList, TouchableOpacity, StyleSheet, Animated, useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tileWidth =
    (width - HORIZONTAL_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  useEffect(() => {
    api.titles
      .popular("movie")
      .then((r) => {
        // Only show titles that have a poster image
        const withPoster = (r.titles as MobileTitle[]).filter(
          (t) => t.poster?.startsWith("http")
        );
        setTitles(withPoster);
      })
      .catch(() => setTitles([]))
      .finally(() => setLoading(false));
  }, []);

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
          <Text style={styles.muted}>No hay títulos disponibles en tus plataformas.</Text>
        ) : (
          <FlatList
            data={titles}
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
  muted: { color: theme.colors.mutedForeground, fontSize: 13 },
});
