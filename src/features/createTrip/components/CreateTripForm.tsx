import { colors } from "@/themes/color";
import { Currency } from "@/types/TCreateTrip";
import { UserPlus } from "lucide-react-native";
import {
  forwardRef,
  RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { CreateTripFormData } from "../validation/createTripFormSchema";
import CurrencyButton from "./CurrencyButton";
import CurrencyPickerBottomSheet from "./CurrencyPickerBottomSheet";
import TripDetailsCard from "./TripDetailsCard";

interface CreateTripFormProps {
  control: Control<CreateTripFormData>;
  /** The trips' currency codes, newest trip first, for the sheet's chips. */
  codes: string[];
  handleCurrencyChange: (currency: Currency) => void;
  scrollViewRef: RefObject<KeyboardAwareScrollViewRef | null>;
}
export interface CreateTripFormHandle {
  focusFirstErrorField: (errors: FieldErrors<CreateTripFormData>) => void;
}

type FocusableField = Exclude<keyof CreateTripFormData, "currency">;

const SCROLL_TOP_PADDING = 40;

//NOTE - Currency excluded: it's a button that opens a sheet, not a focusable TextInput,
// so there's no ref to call .focus()/measureLayout() on.
const FIELD_ORDER: FocusableField[] = ["tripName", "description"];

const CreateTripForm = forwardRef<CreateTripFormHandle, CreateTripFormProps>(
  function CreateTripForm(props, ref) {
    const { control, codes, handleCurrencyChange, scrollViewRef } = props;

    const tripNameRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);
    const fieldRefs = {
      tripName: tripNameRef,
      description: descriptionRef,
    };
    const [isCurrencyPickerOpen, setCurrencyPickerOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focusFirstErrorField: (errors: FieldErrors<CreateTripFormData>) => {
        const firstErrorField = FIELD_ORDER.find((name) => errors[name]);
        if (!firstErrorField) return;

        const fieldRef = fieldRefs[firstErrorField];
        fieldRef.current?.focus();

        const nativeScrollRef = scrollViewRef.current?.getNativeScrollRef();
        if (!nativeScrollRef) return;

        fieldRef.current?.measureLayout(nativeScrollRef, (_x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(y - SCROLL_TOP_PADDING, 0),
            animated: true,
          });
        });
      },
    }));

    return (
      <View className="pt-space-8">
        <TripDetailsCard
          control={control}
          nameRef={tripNameRef}
          noteRef={descriptionRef}
          onNoteSubmit={() => setCurrencyPickerOpen(true)}
        />

        {/* Currency */}
        <View className="mt-space-8 gap-space-2">
          <Text className="text-ink-500 text-micro">Currency</Text>
          <Controller
            control={control}
            name="currency"
            render={({ field: { value } }) => (
              <>
                {/* Opening the sheet blurs the focused field itself (no Keyboard.dismiss) */}
                <CurrencyButton
                  value={value}
                  onPress={() => setCurrencyPickerOpen(true)}
                />
                <CurrencyPickerBottomSheet
                  visible={isCurrencyPickerOpen}
                  onClose={() => setCurrencyPickerOpen(false)}
                  selectedCurrency={value}
                  codes={codes}
                  onCurrencyChange={handleCurrencyChange}
                />
              </>
            )}
          />
          <Text className="text-ink-500 text-caption">
            New expenses start in this currency.
          </Text>
        </View>

        {/* People hint */}
        <View className="mt-space-6 flex-row items-start gap-space-3">
          <UserPlus size={20} strokeWidth={1.75} color={colors.ink[500]} />
          <Text className="flex-1 text-ink-500 text-caption">
            No need to add people now. You&apos;ll add them with the first
            expense.
          </Text>
        </View>
      </View>
    );
  },
);

export default CreateTripForm;
