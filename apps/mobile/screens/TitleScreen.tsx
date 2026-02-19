import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";

type TitleDetail = {
  id: string;
  name: string;
  overview?: string;
  year?: number;
  imdbRating?: number;
  sources?: { providerName: string; type: string; url?: string; price?: number; currency?: string }[];
};

export function TitleScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const id = (route.params as { id?: string })?.id;
  const [title, setTitle] = useState<TitleDetail | null>(null);

  useEffect(() => {
    if (id) api.titles.get(id).then(setTitle).catch(() => setTitle(null));
  }, [id]);

  if (!title) return <View style={styles.container}><Text style={styles.muted}>Cargando...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{title.name}</Text>
      {title.year != null && <Text style={styles.muted}>{title.year}</Text>}
      {title.imdbRating != null && <Text style={styles.muted}>IMDb {title.imdbRating.toFixed(1)}</Text>}
      {title.overview && <Text style={styles.overview}>{title.overview}</Text>}
      <Text style={styles.section}>Dónde ver</Text>
      {(title.sources ?? []).map((s, i) => (
        <TouchableOpacity
          key={i}
          style={styles.sourceRow}
          onPress={() => s.url && Linking.openURL(s.url)}
        >
          <Text style={styles.sourceName}>{s.providerName}</Text>
          <Text style={styles.muted}>{s.type} {s.price != null && s.currency ? `${s.currency} ${s.price}` : ""}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  muted: { color: "#888", marginBottom: 4 },
  overview: { color: "#ccc", marginTop: 12, marginBottom: 16 },
  section: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8 },
  sourceRow: { padding: 12, backgroundColor: "#1a1a1a", borderRadius: 8, marginBottom: 8 },
  sourceName: { color: "#e5b00b", fontWeight: "600" },
});
