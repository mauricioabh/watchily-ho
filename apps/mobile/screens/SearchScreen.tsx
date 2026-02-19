import { useState } from "react";
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Title = { id: string; name: string; type: string; year?: number };

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Title[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    api.titles.search(query.trim()).then((r) => setResults(r.titles as Title[])).catch(() => setResults([])).finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Películas o series..."
        placeholderTextColor="#666"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
      />
      <TouchableOpacity style={styles.button} onPress={search} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Buscando…" : "Buscar"}</Text>
      </TouchableOpacity>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Title", { id: item.id })}
          >
            <Text style={styles.title}>{item.name}</Text>
            {item.year != null && <Text style={styles.muted}>{item.year}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  input: { borderWidth: 1, borderColor: "#333", borderRadius: 8, padding: 12, color: "#fff", marginBottom: 12 },
  button: { backgroundColor: "#e5b00b", padding: 14, borderRadius: 8, marginBottom: 16 },
  buttonText: { color: "#000", textAlign: "center", fontWeight: "600" },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#222" },
  title: { color: "#fff", fontSize: 16 },
  muted: { color: "#888", fontSize: 12 },
});
