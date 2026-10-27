import expoPackage from "expo/package.json";
import nativewindPackage from "nativewind/package.json";
import cssInteropPackage from "react-native-css-interop/package.json";
import reactNativePackage from "react-native/package.json";

type Trigger = {
  name: string;
  installed: string;
  checked: string;
  // "major" for decisions that only revisit on an SDK upgrade
  part: "full" | "major";
  then: string;
};

// Decisions whose "Revisit when" is a dependency version. A failure means the
// dependency moved: do the re-check in `then`, then set `checked`.
const TRIGGERS: Trigger[] = [
  {
    name: "react-native",
    installed: reactNativePackage.version,
    checked: "0.86.3",
    part: "full",
    then: "re-verify the RN internals in documentation/sheet-keyboard-tech-spec.md §2.3 (ADR 0014)",
  },
  {
    name: "nativewind",
    installed: nativewindPackage.version,
    checked: "4.2.6",
    part: "full",
    then: "retry a Pressable function style on device (isotes-code-style.md, Pressable function styles)",
  },
  {
    name: "react-native-css-interop",
    installed: cssInteropPackage.version,
    checked: "0.2.6",
    part: "full",
    then: "retry a Pressable function style on device (isotes-code-style.md, Pressable function styles)",
  },
  {
    name: "expo",
    installed: expoPackage.version,
    checked: "57.0.30",
    part: "major",
    then: "re-check jest-expo and eslint-config-expo against ADR 0016",
  },
];

function comparable(version: string, part: Trigger["part"]) {
  return part === "major" ? version.split(".")[0] : version;
}

function staleMessage(trigger: Trigger): string | null {
  const { name, installed, checked, part, then } = trigger;
  if (comparable(installed, part) === comparable(checked, part)) return null;
  return `${name} is ${installed}, but the decision was checked at ${checked}. Next: ${then}, then set checked to ${installed}.`;
}

describe("revisit triggers", () => {
  it.each(TRIGGERS)("$name is still the checked version", (trigger) => {
    expect(staleMessage(trigger)).toBeNull();
  });
});
