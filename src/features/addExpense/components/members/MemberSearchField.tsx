import { BottomSheetTextInput } from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { CircleX, Search } from "lucide-react-native";
import { ReactElement } from "react";
import { Pressable, View } from "react-native";

interface MemberSearchFieldProps {
  query: string;
  onChangeQuery: (query: string) => void;
}

// font and size only: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const searchTextStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
};

export default function MemberSearchField(
  props: MemberSearchFieldProps,
): ReactElement {
  const { query, onChangeQuery } = props;

  return (
    <View className="h-space-12 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-4">
      <Search size={20} strokeWidth={1.75} color={colors.ink[500]} />
      <BottomSheetTextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Search people"
        placeholderTextColor={colors.ink[500]}
        accessibilityLabel="Search people"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        cursorColor={colors.ink[900]}
        selectionColor={colors.ink[900]}
        className="h-full flex-1 text-ink-900"
        style={searchTextStyle}
      />
      {query !== "" && (
        // NOTE - no token for the 44pt tap target, falling back to h-[44px] w-[44px]
        // -mr-space-3 eats into the field's 16 padding, so the glyph sits 4 from the edge
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeQuery("")}
          className="-mr-space-3 h-[44px] w-[44px] items-center justify-center"
        >
          {/* //NOTE - no filled CircleX icon, falling back to a CircleX filled ink-500 with a card stroke */}
          <CircleX
            size={20}
            strokeWidth={2}
            color={colors.card}
            fill={colors.ink[500]}
          />
        </Pressable>
      )}
    </View>
  );
}
