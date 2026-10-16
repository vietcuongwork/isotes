import type { FontSource } from "expo-font";
import FrauncesBold from "./Fraunces_72pt-Bold.ttf";
import FrauncesMedium from "./Fraunces_72pt-Medium.ttf";
import FrauncesRegular from "./Fraunces_72pt-Regular.ttf";
import OutfitBold from "./Outfit-Bold.ttf";
import OutfitLight from "./Outfit-Light.ttf";
import OutfitMedium from "./Outfit-Medium.ttf";
import OutfitRegular from "./Outfit-Regular.ttf";
import OutfitSemiBold from "./Outfit-SemiBold.ttf";
import SanFranciscoRegular from "./SFPro-Regular.otf";

export const fonts: Record<string, FontSource> = {
  "fraunces-bold": FrauncesBold,
  "fraunces-regular": FrauncesRegular,
  // cut from the variable font: Google Fonts ships no static 72pt Medium
  // why: [[Feat_ink-shine-foundation_implementation]] §T5
  "fraunces-medium": FrauncesMedium,
  "outfit-light": OutfitLight,
  "outfit-regular": OutfitRegular,
  "outfit-medium": OutfitMedium,
  "outfit-semibold": OutfitSemiBold,
  "outfit-bold": OutfitBold,
  "sf-regular": SanFranciscoRegular,
};
