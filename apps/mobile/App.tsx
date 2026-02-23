import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0b1120" },
          headerTintColor: theme.colors.foreground,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Watchily" }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Watchily" }} />
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
  );
}
