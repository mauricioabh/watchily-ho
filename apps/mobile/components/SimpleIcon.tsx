import SvgUri from "expo-svg-uri";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Iconos de marcas desde Simple Icons CDN.
 * Slugs: https://simpleicons.org
 * Si fallback=true, usa play-circle (para slugs que no existen: disneyplus).
 */
const CDN = "https://cdn.simpleicons.org";

export function SimpleIcon({
  name,
  color,
  size = 24,
  fallback = false,
}: {
  name: string;
  color: string;
  size?: number;
  fallback?: boolean;
}) {
  if (fallback) {
    return <MaterialCommunityIcons name="play-circle" size={size} color={color} />;
  }
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const uri = `${CDN}/${name}/${hex}`;
  return <SvgUri width={size} height={size} source={{ uri }} />;
}
