import {
  Image,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
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

/* ── Bookmark button ── */
function BookmarkButton({ title }: { title: MobileTitle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [listIds, setListIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.lists
      .forTitle(title.id)
      .then((d) => {
        const ids = d.listIdsByTitle?.[title.id] ?? [];
        setListIds(ids);
        setBookmarked(ids.length > 0);
      })
      .catch(() => {});
  }, [title.id]);

  const handlePress = async () => {
    if (loading) return;

    if (bookmarked) {
      // Already bookmarked — offer to remove from all lists
      Alert.alert(
        title.name,
        "¿Quitar de tus listas?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Quitar",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                await Promise.all(listIds.map((id) => api.lists.removeItem(id, title.id)));
                setListIds([]);
                setBookmarked(false);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Not bookmarked — fetch lists and let user pick or create
    setLoading(true);
    try {
      const { lists } = await api.lists.all();

      if (lists.length === 0) {
        // No lists → create default and add
        const created = await api.lists.create("Mi lista");
        await api.lists.addItem(created.id, title.id, title.type ?? "movie");
        setListIds([created.id]);
        setBookmarked(true);
        return;
      }

      const options = lists.map((l) => ({
        text: l.name,
        onPress: async () => {
          setLoading(true);
          try {
            await api.lists.addItem(l.id, title.id, title.type ?? "movie");
            setListIds((prev) => [...prev, l.id]);
            setBookmarked(true);
          } finally {
            setLoading(false);
          }
        },
      }));

      Alert.alert("Añadir a lista", title.name, [
        ...options,
        { text: "Cancelar", style: "cancel" },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo cargar tus listas.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {/* Ratings */}
        {(title.imdbRating != null || title.criticScore != null) && (
          <View style={styles.ratings}>
            {title.imdbRating != null && (
              <View style={styles.imdbBadge}>
                <Text style={styles.imdbText}>IMDb {title.imdbRating.toFixed(1)}</Text>
              </View>
            )}
            {title.criticScore != null && (
              <View style={[styles.rtBadge, title.criticScore >= 60 ? styles.rtFresh : styles.rtRotten]}>
                <Text style={styles.rtText}>
                  {title.criticScore >= 60 ? "🍅" : "🥦"} {title.criticScore}%
                </Text>
              </View>
            )}
          </View>
        )}

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
  ratings: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  imdbBadge: { backgroundColor: "#f5c518", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  imdbText: { color: "#000", fontSize: 10, fontWeight: "700" },
  rtBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  rtFresh: { backgroundColor: "#dc2626" },
  rtRotten: { backgroundColor: "#52525b" },
  rtText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  platforms: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
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
