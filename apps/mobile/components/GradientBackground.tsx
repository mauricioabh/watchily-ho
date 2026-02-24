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
 * Glow overlays use LinearGradient (fade to transparent) to mimic web radial-gradients.
 * Use this as the outermost wrapper in every screen instead of a plain View.
 */
export function GradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      {/* Base gradient (matches web: linear-gradient 180deg) */}
      <LinearGradient
        colors={theme.gradient.colors}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Blue glow top-center (web: ellipse 90% 55% at 50% -5%, rgba(56,120,255,0.38)) */}
      <LinearGradient
        colors={[theme.gradient.glowBlue, "transparent"]}
        style={styles.glowBlue}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      {/* Purple glow top-left (web: ellipse 55% 45% at -5% 15%, rgba(130,60,220,0.22)) */}
      <LinearGradient
        colors={[theme.gradient.glowPurple, "transparent"]}
        style={styles.glowPurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        pointerEvents="none"
      />
      {/* Blue-teal glow top-right (web: ellipse 50% 40% at 105% 10%, rgba(20,160,220,0.18)) */}
      <LinearGradient
        colors={[theme.gradient.glowTeal, "transparent"]}
        style={styles.glowTeal}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  glowBlue: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    height: 280,
  },
  glowPurple: {
    position: "absolute",
    top: -20,
    left: -40,
    width: 220,
    height: 200,
  },
  glowTeal: {
    position: "absolute",
    top: -20,
    right: -40,
    width: 200,
    height: 180,
  },
});
