import {
  BottomSheet,
  BottomSheetScrollView,
} from "@/components/sheet-keyboard";
import { Currency } from "@/types/TCreateTrip";
import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CURRENCY_OPTIONS } from "../constants";
import {
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

// The Sheet board's top edge sits 100 below the screen's top
const SHEET_TOP = 100;
const RECENT_LIMIT = 3;
const CURRENCY_GROUPS = groupCurrenciesByLetter(CURRENCY_OPTIONS);

const LETTER_HEADER_CLASS =
  "bg-card pb-space-1 pt-space-5 text-ink-500 text-micro";

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

// Its own component so per-open state resets: the sheet unmounts its children while hidden
function CurrencySheetContent(props: CurrencySheetContentProps) {
  const { codes, selectedCode, onSelect } = props;

  const [pinnedLetter, setPinnedLetter] = useState<string | null>(null);
  const headerYs = useRef(new Map<string, number>());
  const scrollY = useRef(0);

  const recent = getRecentCurrencies(codes, CURRENCY_OPTIONS, RECENT_LIMIT);

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

  return (
    <View className="flex-1">
      <BottomSheetScrollView onScroll={handleScroll}>
        <View className="px-space-5">
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
        </View>
      </BottomSheetScrollView>

      {/* Pinned letter, drawn over the list; the in-flow header carries the role */}
      {pinnedLetter && (
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
