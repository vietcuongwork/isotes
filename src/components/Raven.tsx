import { Image } from "expo-image";

export type RavenPose =
  "relaxed" | "happy" | "peeking" | "sleeping" | "confused" | "lantern";

// aspectRatio = pixel width / height of each WebP (DESIGN.md "The raven")
const POSES = {
  relaxed: {
    source: require("@/assets/images/raven/raven-relaxed.webp"),
    aspectRatio: 433 / 382,
  },
  happy: {
    source: require("@/assets/images/raven/raven-happy.webp"),
    aspectRatio: 443 / 453,
  },
  peeking: {
    source: require("@/assets/images/raven/raven-peeking.webp"),
    aspectRatio: 260 / 378,
  },
  sleeping: {
    source: require("@/assets/images/raven/raven-sleeping.webp"),
    aspectRatio: 433 / 291,
  },
  confused: {
    source: require("@/assets/images/raven/raven-confused.webp"),
    aspectRatio: 320 / 419,
  },
  lantern: {
    source: require("@/assets/images/raven/raven-lantern.webp"),
    aspectRatio: 442 / 320,
  },
} satisfies Record<RavenPose, { source: number; aspectRatio: number }>;

interface RavenProps {
  pose: RavenPose;
  height: number;
  /** Omit for decoration: the raven is then hidden from VoiceOver. */
  accessibilityLabel?: string;
}

export default function Raven(props: RavenProps) {
  const { pose, height, accessibilityLabel } = props;
  const { source, aspectRatio } = POSES[pose];
  const decorative = accessibilityLabel === undefined;

  return (
    <Image
      source={source}
      contentFit="contain"
      style={{ height, width: height * aspectRatio }}
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
    />
  );
}
