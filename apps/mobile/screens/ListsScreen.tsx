import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type List = { id: string; name: string };

export function ListsScreen() {
  const [lists, setLists] = useState<List[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    api.lists().then((r) => setLists(r.lists as List[])).catch(() => setLists([]));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mis listas</Text>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row}>
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  row: { padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, marginBottom: 8 },
  title: { color: "#fff", fontSize: 16 },
});
