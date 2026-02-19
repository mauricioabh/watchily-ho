import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Title = { id: string; name: string; type: string; year?: number; poster?: string };

export function HomeScreen() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    api.titles.popular("movie").then((r) => setTitles(r.titles as Title[])).catch(() => setTitles([])).finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Search")}>
        <Text style={styles.navText}>Buscar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Lists")}>
        <Text style={styles.navText}>Listas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.navText}>Configuración</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Popular</Text>
      {loading ? (
        <Text style={styles.muted}>Cargando...</Text>
      ) : (
        <FlatList
          data={titles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("Title", { id: item.id })}
            >
              <Text style={styles.tileTitle}>{item.name}</Text>
              {item.year != null && <Text style={styles.muted}>{item.year}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  navButton: { padding: 12, marginBottom: 8 },
  navText: { color: "#e5b00b", fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 16, marginBottom: 8 },
  muted: { color: "#888", fontSize: 12 },
  tile: { flex: 1, margin: 4, padding: 12, backgroundColor: "#1a1a1a", borderRadius: 8 },
  tileTitle: { color: "#fff", fontWeight: "600" },
});
