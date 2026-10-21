import { useShakeOnTrigger } from "@/components/formfield/useShakeOnTrigger";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { cn } from "@/utils/cn";
import { mergeRefs } from "@/utils/utils";
import { CircleAlert } from "lucide-react-native";
import { RefObject } from "react";
import { Control, Controller, useFormState } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { CreateTripFormData } from "../validation/createTripFormSchema";

interface TripDetailsCardProps {
  control: Control<CreateTripFormData>;
  nameRef: RefObject<TextInput | null>;
  noteRef: RefObject<TextInput | null>;
  onNoteSubmit: () => void;
}

// The name wraps, so it's multiline (a UITextView), which keeps title's line height
const nameTextStyle = textStyle("title");

// NOTE - no token for body without its line height, falling back to body's
// font and size: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const noteTextStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
  height: body.lineHeight, // 24: body's line height, back as the box's height
};

function NameField(
  props: Pick<TripDetailsCardProps, "control" | "nameRef"> & {
    onSubmit: () => void;
  },
) {
  const { control, nameRef, onSubmit } = props;
  const { submitCount, errors } = useFormState({ control });
  const error = errors.tripName?.message;
  const shakeStyle = useShakeOnTrigger(submitCount, !!error);

  return (
    <View className="gap-space-1 p-space-4">
      <Text
        className={cn("text-micro", error ? "text-owe-600" : "text-ink-500")}
      >
        Trip name
      </Text>
      <Animated.View style={shakeStyle}>
        <Controller
          control={control}
          name="tripName"
          render={({ field: { value, onChange, onBlur, ref: rhfRef } }) => (
            <TextInput
              ref={mergeRefs(nameRef, rhfRef)}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Kyoto in spring"
              placeholderTextColor={colors.ink[400]}
              multiline
              scrollEnabled={false}
              // Return moves on instead of adding a line break
              submitBehavior="submit"
              returnKeyType="next"
              onSubmitEditing={onSubmit}
              className="p-0 text-ink-900"
              style={nameTextStyle}
            />
          )}
        />
      </Animated.View>
      {error && (
        <View className="flex-row items-center gap-space-1">
          {/* //NOTE - no token for a 16pt inline icon (icons are 20 or 24), falling back to size={16} */}
          <CircleAlert size={16} strokeWidth={1.75} color={colors.owe[600]} />
          <Text className="text-owe-600 text-caption">{error}</Text>
        </View>
      )}
    </View>
  );
}

function NoteField(
  props: Pick<TripDetailsCardProps, "control" | "noteRef" | "onNoteSubmit">,
) {
  const { control, noteRef, onNoteSubmit } = props;

  return (
    <View className="gap-space-1 p-space-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-ink-500 text-micro">Note</Text>
        <Text className="text-ink-500 text-caption">Optional</Text>
      </View>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur, ref: rhfRef } }) => (
          <TextInput
            ref={mergeRefs(noteRef, rhfRef)}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Dates, the occasion, who's coming"
            placeholderTextColor={colors.ink[400]}
            submitBehavior="submit"
            returnKeyType="next"
            onSubmitEditing={onNoteSubmit}
            className="p-0 text-ink-900"
            style={noteTextStyle}
          />
        )}
      />
    </View>
  );
}

/** The trip's name and note in one card. */
export default function TripDetailsCard(props: TripDetailsCardProps) {
  const { control, nameRef, noteRef, onNoteSubmit } = props;

  return (
    <View className="rounded-lg bg-card shadow-card">
      <NameField
        control={control}
        nameRef={nameRef}
        onSubmit={() => noteRef.current?.focus()}
      />
      <View className="mx-space-4 border-t border-ink-100" />
      <NoteField
        control={control}
        noteRef={noteRef}
        onNoteSubmit={onNoteSubmit}
      />
    </View>
  );
}
