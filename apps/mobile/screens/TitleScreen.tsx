import { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
  StyleSheet, Animated, ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";

type Source = {
  providerName: string;
  type: "sub" | "rent" | "buy" | "free";
  url?: string;
  price?: number;
  quality?: string;
};

type TitleDetail = {
  id: string;
  name: string;
  overview?: string;
  year?: number;
  runtime?: number;
  genres?: string[];
  imdbRating?: number;
  userRating?: number;
  criticScore?: number;
  rottenTomatoesRating?: number;
  sources?: Source[];
  type?: string;
};

function ScorePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.scorePill, { borderColor: color + "55" }]}>
      <Text style={[styles.scoreLabel, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.scoreValue, { color }]}>{value}</Text>
    </View>
  );
}

export function TitleScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const id = (route.params as { id?: string })?.id;
  const [title, setTitle] = useState<TitleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    api.titles.get(id)
      .then(setTitle)
      .catch(() => setTitle(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [loading, fadeAnim]);

  const subSources = title?.sources?.filter((s) => s.type === "sub") ?? [];
  const paidSources = title?.sources?.filter((s) => s.type !== "sub") ?? [];

  if (loading) {
    return (
      <GradientBackground style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </GradientBackground>
    );
  }

  if (!title) {
    return (
      <GradientBackground style={styles.centered}>
        <Text style={styles.muted}>No se pudo cargar el título.</Text>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          {/* Title + meta */}
          <View style={styles.header}>
            <Text style={styles.name}>{title.name}</Text>
            <View style={styles.metaRow}>
              {title.year != null && <Text style={styles.metaChip}>{title.year}</Text>}
              {title.runtime != null && <Text style={styles.metaChip}>{title.runtime} min</Text>}
              {title.type === "series" && <Text style={[styles.metaChip, styles.seriesBadge]}>SERIE</Text>}
            </View>
            {title.genres?.length ? (
              <Text style={styles.genres}>{title.genres.slice(0, 3).join(" · ")}</Text>
            ) : null}
          </View>

          {/* Scores */}
          {(title.imdbRating != null || title.userRating != null || title.criticScore != null) && (
            <View style={styles.scoresRow}>
              {title.imdbRating != null && (
                <ScorePill label="IMDb" value={title.imdbRating.toFixed(1)} color="#f5c518" />
              )}
              {title.userRating != null && (
                <ScorePill label="Usuario" value={title.userRating.toFixed(1)} color="#60a5fa" />
              )}
              {title.criticScore != null && (
                <ScorePill
                  label="Crítica"
                  value={`${title.criticScore}%`}
                  color={title.criticScore >= 60 ? "#4ade80" : "#f87171"}
                />
              )}
            </View>
          )}

          {/* Synopsis */}
          {title.overview ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sinopsis</Text>
              <Text style={styles.overview}>{title.overview}</Text>
            </View>
          ) : null}

          {/* Subscription sources */}
          {subSources.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disponible con suscripción</Text>
              {subSources.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sourceRow}
                  onPress={() => s.url && Linking.openURL(s.url)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceName}>{s.providerName}</Text>
                    <Text style={styles.sourceType}>
                      Incluido{s.quality ? ` · ${s.quality}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.verAhora}>Ver →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Paid sources */}
          {paidSources.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alquiler / Compra</Text>
              {paidSources.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sourceRow}
                  onPress={() => s.url && Linking.openURL(s.url)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceName}>{s.providerName}</Text>
                    <Text style={styles.sourceType}>
                      {s.type === "rent" ? "Alquiler" : "Compra"}
                      {s.price != null ? ` · $${s.price}` : ""}
                      {s.quality ? ` · ${s.quality}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.verAhora}>Ver →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {subSources.length === 0 && paidSources.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.muted}>No hay fuentes de streaming disponibles.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1, padding: 16 },
  backBtn: { paddingVertical: 8, marginBottom: 8 },
  backText: { color: theme.colors.mutedForeground, fontSize: 14 },
  header: { marginBottom: 16 },
  name: { fontSize: 26, fontWeight: "bold", color: theme.colors.foreground, marginBottom: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  metaChip: {
    color: theme.colors.mutedForeground, fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  seriesBadge: { color: theme.colors.primaryForeground, backgroundColor: theme.colors.primary },
  genres: { color: theme.colors.mutedForeground, fontSize: 12 },
  scoresRow: { flexDirection: "row", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  scorePill: {
    alignItems: "center", borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 64,
  },
  scoreLabel: { fontSize: 10, marginBottom: 2 },
  scoreValue: { fontSize: 20, fontWeight: "bold" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground, marginBottom: 10 },
  overview: { color: theme.colors.mutedForeground, lineHeight: 22, fontSize: 14 },
  sourceRow: {
    flexDirection: "row", alignItems: "center",
    padding: 12, backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md, marginBottom: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  sourceName: { color: theme.colors.foreground, fontWeight: "600", fontSize: 14 },
  sourceType: { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 2 },
  verAhora: { color: theme.colors.primary, fontWeight: "600", fontSize: 13 },
  muted: { color: theme.colors.mutedForeground },
});
