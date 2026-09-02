import type { FontSource } from "expo-font";
import FrauncesBold from "./Fraunces_72pt-Bold.ttf";
import OutfitBold from "./Outfit-Bold.ttf";
import OutfitLight from "./Outfit-Light.ttf";
import OutfitMedium from "./Outfit-Medium.ttf";
import OutfitRegular from "./Outfit-Regular.ttf";
import OutfitSemiBold from "./Outfit-SemiBold.ttf";

export const fonts: Record<string, FontSource> = {
  "fraunces-bold": FrauncesBold,
  "outfit-light": OutfitLight,
  "outfit-regular": OutfitRegular,
  "outfit-medium": OutfitMedium,
  "outfit-semibold": OutfitSemiBold,
  "outfit-bold": OutfitBold,
};
