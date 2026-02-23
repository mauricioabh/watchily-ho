import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";

type Props = {
  children: React.ReactNode;
  style?: object;
};

/**
 * Full-screen gradient background matching the Watchily web app look.
 * Deep blue-navy at the top, fading to near-black at the bottom.
 * Use this as the outermost wrapper in every screen instead of a plain View.
 */
export function GradientBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={theme.gradient.colors}
      locations={[0, 0.3, 0.65, 1]}
      style={[styles.gradient, style]}
    >
      {/* Blue glow overlay at top-center */}
      <View style={styles.glowBlue} pointerEvents="none" />
      {/* Purple glow overlay at top-left */}
      <View style={styles.glowPurple} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  glowBlue: {
    position: "absolute",
    top: -80,
    left: "10%",
    right: "10%",
    height: 320,
    borderRadius: 999,
    backgroundColor: theme.gradient.glowBlue,
    transform: [{ scaleX: 1.6 }],
  },
  glowPurple: {
    position: "absolute",
    top: -60,
    left: -80,
    width: 280,
    height: 260,
    borderRadius: 999,
    backgroundColor: theme.gradient.glowPurple,
  },
});
