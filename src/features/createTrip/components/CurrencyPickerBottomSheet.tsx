import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@/components/sheet-keyboard";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { Currency } from "@/types/TCreateTrip";
import { Search, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CURRENCY_OPTIONS } from "../constants";
import {
  filterCurrencies,
  getPinnedLetter,
  getRecentCurrencies,
  groupCurrenciesByLetter,
} from "../helpers/currencyHelpers";
import CurrencyRow from "./CurrencyRow";
import RecentCurrencyChips from "./RecentCurrencyChips";

export interface CurrencyPickerBottomSheetProps {
  visible: boolean;
  selectedCurrency: Currency;
  /** The trips' currency codes, newest trip first. */
  codes: string[];
  onCurrencyChange: (currency: Currency) => void;
  onClose: () => void;
}

interface CurrencySheetContentProps {
  codes: string[];
  selectedCode: string;
  onSelect: (currency: Currency) => void;
}

interface CurrencySectionProps {
  letter: string;
  currencies: Currency[];
  selectedCode: string;
  onSelect: (currency: Currency) => void;
  onHeaderLayout: (letter: string, y: number) => void;
}

interface CurrencySearchFieldProps {
  query: string;
  onChangeQuery: (query: string) => void;
}

interface CurrencyResultsProps {
  query: string;
  selectedCode: string;
  onSelect: (currency: Currency) => void;
  onClear: () => void;
}

interface CurrencyNoMatchesProps {
  query: string;
  onClear: () => void;
}

// The Sheet board's top edge sits 100 below the screen's top
const SHEET_TOP = 100;
const RECENT_LIMIT = 3;
const CURRENCY_GROUPS = groupCurrenciesByLetter(CURRENCY_OPTIONS);

const LETTER_HEADER_CLASS =
  "bg-card pb-space-1 pt-space-5 text-ink-500 text-micro";

// NOTE - no token for body without its line height, falling back to body's
// font and size: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const searchTextStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
};

function CurrencySection(props: CurrencySectionProps) {
  const { letter, currencies, selectedCode, onSelect, onHeaderLayout } = props;

  return (
    // The section starts with its header, so its y is the header's y in the list
    <View onLayout={(e) => onHeaderLayout(letter, e.nativeEvent.layout.y)}>
      <Text accessibilityRole="header" className={LETTER_HEADER_CLASS}>
        {letter}
      </Text>
      {currencies.map((currency) => (
        <CurrencyRow
          key={currency.code}
          currency={currency}
          selected={currency.code === selectedCode}
          onPress={() => onSelect(currency)}
        />
      ))}
    </View>
  );
}

function CurrencySearchField(props: CurrencySearchFieldProps) {
  const { query, onChangeQuery } = props;

  return (
    // mt-space-1: the header leaves 8 under the 44 X, so the field sits 12 (space-3) below it
    <View className="mx-space-5 mt-space-1 h-space-12 flex-row items-center gap-space-2 rounded-md bg-ink-100 px-space-4">
      <Search size={20} strokeWidth={1.75} color={colors.ink[500]} />
      <BottomSheetTextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Name, code or symbol"
        placeholderTextColor={colors.ink[500]}
        accessibilityLabel="Search currencies"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        // A light sheet, whatever the system appearance (the input defaults to dark)
        keyboardAppearance="light"
        className="h-full flex-1 text-ink-900"
        style={searchTextStyle}
      />
      {query.trim() !== "" && (
        // NOTE - no token for the 44pt tap target, falling back to h-[44px] w-[44px]
        // -mr-space-3 eats into the field's 16 padding, as the board's -12 margin does
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          testID="currency-search-clear"
          onPress={() => onChangeQuery("")}
          className="-mr-space-3 h-[44px] w-[44px] items-center justify-center"
        >
          <X size={16} strokeWidth={2} color={colors.ink[500]} />
        </Pressable>
      )}
    </View>
  );
}

function CurrencyNoMatches(props: CurrencyNoMatchesProps) {
  const { query, onClear } = props;

  return (
    <View className="items-center gap-space-2 px-space-5 pt-space-12">
      <Text
        accessibilityRole="header"
        className="text-center text-ink-900 text-heading"
      >
        Nothing matches “{query.trim()}”
      </Text>
      <Text className="text-center text-ink-500 text-caption">
        Try a code like EUR, or a symbol like €.
      </Text>
      {/* //NOTE - no token for the 44pt button height, falling back to h-[44px] */}
      <Pressable
        accessibilityRole="button"
        testID="currency-no-matches-clear"
        onPress={onClear}
        className="h-[44px] justify-center px-space-4"
      >
        <Text className="text-ink-700 text-label">Clear search</Text>
      </Pressable>
    </View>
  );
}

function CurrencyResults(props: CurrencyResultsProps) {
  const { query, selectedCode, onSelect, onClear } = props;

  const results = filterCurrencies(CURRENCY_OPTIONS, query);

  if (results.length === 0)
    return <CurrencyNoMatches query={query} onClear={onClear} />;

  return (
    <>
      <View className="flex-row justify-between pb-space-1 pt-space-5">
        <Text className="text-ink-500 text-micro">Results</Text>
        <Text className="text-ink-500 text-micro">{results.length}</Text>
      </View>
      {results.map((currency) => (
        <CurrencyRow
          key={currency.code}
          currency={currency}
          selected={currency.code === selectedCode}
          onPress={() => onSelect(currency)}
        />
      ))}
    </>
  );
}

// Its own component so per-open state resets: the sheet unmounts its children while hidden
function CurrencySheetContent(props: CurrencySheetContentProps) {
  const { codes, selectedCode, onSelect } = props;

  const [query, setQuery] = useState("");
  const [pinnedLetter, setPinnedLetter] = useState<string | null>(null);
  const headerYs = useRef(new Map<string, number>());
  const scrollY = useRef(0);

  const recent = getRecentCurrencies(codes, CURRENCY_OPTIONS, RECENT_LIMIT);
  // A query of only spaces still shows the chips and letters, as on the board
  const searching = query.trim() !== "";

  // An overlay, since stickyHeaderIndices can't reach the headers
  // why: [[Debug_sheet-sticky-header-indices]]
  const updatePinnedLetter = () => {
    const headers = CURRENCY_GROUPS.flatMap(({ letter }) => {
      const y = headerYs.current.get(letter);
      return y === undefined ? [] : [{ letter, y }];
    });
    setPinnedLetter(getPinnedLetter(headers, scrollY.current));
  };

  const handleHeaderLayout = (letter: string, y: number) => {
    headerYs.current.set(letter, y);
    updatePinnedLetter();
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    updatePinnedLetter();
  };

  const handleClear = () => setQuery("");

  return (
    <View className="flex-1">
      <CurrencySearchField query={query} onChangeQuery={setQuery} />

      {/* List, with the pinned letter placed against its top */}
      <View className="flex-1">
        <BottomSheetScrollView onScroll={handleScroll}>
          <View className="px-space-5">
            {searching ? (
              <CurrencyResults
                query={query}
                selectedCode={selectedCode}
                onSelect={onSelect}
                onClear={handleClear}
              />
            ) : (
              <>
                <RecentCurrencyChips
                  currencies={recent}
                  selectedCode={selectedCode}
                  onSelect={onSelect}
                />
                {CURRENCY_GROUPS.map((group) => (
                  <CurrencySection
                    key={group.letter}
                    letter={group.letter}
                    currencies={group.currencies}
                    selectedCode={selectedCode}
                    onSelect={onSelect}
                    onHeaderLayout={handleHeaderLayout}
                  />
                ))}
              </>
            )}
          </View>
        </BottomSheetScrollView>

        {/* Pinned letter, drawn over the list; the in-flow header carries the role */}
        {!searching && pinnedLetter && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute left-space-5 right-space-5 top-0"
          >
            <Text className={LETTER_HEADER_CLASS}>{pinnedLetter}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CurrencyPickerBottomSheet(
  props: CurrencyPickerBottomSheetProps,
) {
  const { visible, selectedCurrency, codes, onCurrencyChange, onClose } = props;

  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const handleSelect = (currency: Currency) => {
    onCurrencyChange(currency);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Currency"
      showCloseButton
      appearance="light"
      closeAccessibilityLabel="Close currency sheet"
      snapPoints={[windowHeight - SHEET_TOP]}
      safeAreaInsets={safeAreaInsets}
    >
      <CurrencySheetContent
        codes={codes}
        selectedCode={selectedCurrency.code}
        onSelect={handleSelect}
      />
    </BottomSheet>
  );
}
