import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { ListsScreen } from "./screens/ListsScreen";
import { ListDetailScreen } from "./screens/ListDetailScreen";
import { AllTitlesScreen } from "./screens/AllTitlesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { useAuth } from "./hooks/useAuth";
import { theme } from "./theme";

const Stack = createNativeStackNavigator();

function HomeHeaderRight({ navigation }: { navigation: any }) {
  return (
    <View style={headerStyles.row}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Search")}
        style={headerStyles.iconBtn}
        activeOpacity={0.7}
        accessibilityLabel="Buscar"
      >
        <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.foreground} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Lists")}
        style={headerStyles.iconBtn}
        activeOpacity={0.7}
        accessibilityLabel="Listas"
      >
        <MaterialCommunityIcons name="format-list-bulleted" size={22} color={theme.colors.foreground} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Settings")}
        style={headerStyles.iconBtn}
        activeOpacity={0.7}
        accessibilityLabel="Configuración"
      >
        <MaterialCommunityIcons name="cog" size={22} color={theme.colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

function HomeHeaderLeft() {
  return (
    <View style={headerStyles.logoRow}>
      <MaterialCommunityIcons name="film" size={20} color={theme.colors.primary} />
      <Text style={headerStyles.logoText}>Watchily</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginRight: 4, alignItems: "center" },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: theme.colors.foreground, fontSize: 18, fontWeight: "600", letterSpacing: -0.3 },
});

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" translucent={false} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#0b1120" },
            headerTintColor: theme.colors.foreground,
            headerShadowVisible: false,
            headerTranslucent: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "fade",
          }}
        >
        {!user ? (
          <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: "",
                headerLeft: () => <HomeHeaderLeft />,
                headerRight: () => <HomeHeaderRight navigation={navigation} />,
              })}
            />
            <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Buscar" }} />
            <Stack.Screen name="Title" component={TitleScreen} options={{ title: "Detalle" }} />
            <Stack.Screen name="Lists" component={ListsScreen} options={{ title: "Listas" }} />
            <Stack.Screen
              name="ListDetail"
              component={ListDetailScreen}
              options={({ route }: any) => ({ title: route.params?.name ?? "Lista" })}
            />
            <Stack.Screen name="AllTitles" component={AllTitlesScreen} options={{ title: "Ver todo" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Configuración" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
