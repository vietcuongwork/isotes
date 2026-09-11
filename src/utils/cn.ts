import { roles } from "@/themes/typography";
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

type AdditionalClassGroupIds = "text-role";

const twMerge = extendTailwindMerge<AdditionalClassGroupIds>({
  extend: {
    classGroups: {
      // text-<role> utilities from the typography plugin — their own group so
      // they don't get merged into text-color and dropped (see §? in docs).
      "text-role": [{ text: Object.keys(roles) }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
