import { colors } from "@/themes/color";
import {
  Calendar,
  fromDateId,
  toDateId,
  useCalendar,
  type CalendarDayMetadata,
  type CalendarTheme,
} from "@marceloterreiro/flash-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

// 44px cell, 38px circle → 3px padding each side (the library's own default
// padding is 6px, too tight for the 38px circle in the design).
const DAY_HEIGHT = 44;
const DAY_CIRCLE_RADIUS = 999;

const theme: CalendarTheme = {
  itemWeekName: {
    content: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.grey[400],
      letterSpacing: 0.6,
    },
  },
  itemDay: {
    idle: ({ isDifferentMonth, isPressed }) => ({
      container: {
        aspectRatio: 1,
        backgroundColor: isPressed ? colors.grey[900] : "transparent",
      },
      content: {
        fontSize: 15,
        fontWeight: "400",
        color: isDifferentMonth ? colors.grey[500] : colors.grey[100],
      },
    }),
    today: ({ isPressed }) => ({
      container: {
        aspectRatio: 1,
        borderRadius: DAY_CIRCLE_RADIUS,
        borderTopLeftRadius: DAY_CIRCLE_RADIUS,
        borderTopRightRadius: DAY_CIRCLE_RADIUS,
        borderBottomLeftRadius: DAY_CIRCLE_RADIUS,
        borderBottomRightRadius: DAY_CIRCLE_RADIUS,
        borderWidth: 1,
        borderColor: colors.orange[700],
        backgroundColor: isPressed ? colors.grey[900] : "transparent",
      },
      content: { fontSize: 15, fontWeight: "500", color: colors.orange[400] },
    }),
    active: () => ({
      container: {
        aspectRatio: 1,
        borderRadius: DAY_CIRCLE_RADIUS,
        backgroundColor: colors.orange[400],
        // same value as the `shadow-selected` Tailwind token (ActivityPicker)
        shadowColor: colors.orange[400],
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        shadowOpacity: 0.12,
        borderTopLeftRadius: DAY_CIRCLE_RADIUS,
        borderTopRightRadius: DAY_CIRCLE_RADIUS,
        borderBottomLeftRadius: DAY_CIRCLE_RADIUS,
        borderBottomRightRadius: DAY_CIRCLE_RADIUS,
      },
      content: { fontSize: 15, fontWeight: "500", color: colors.orange[900] },
    }),
  },
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

interface DateCalendarProps {
  /** Any date ID within the month to display */
  calendarMonthId: string;
  selectedDateId: string;
  onSelectDate: (dateId: string) => void;
  onMonthChange: (monthId: string) => void;
}

export default function DateCalendar(props: DateCalendarProps) {
  const { calendarMonthId, selectedDateId, onSelectDate, onMonthChange } =
    props;

  const { weeksList, calendarRowMonth, weekDaysList } = useCalendar({
    calendarMonthId,
    calendarFirstDayOfWeek: "monday",
    calendarActiveDateRanges: [
      { startId: selectedDateId, endId: selectedDateId },
    ],
  });

  const handleDayPress = (metadata: CalendarDayMetadata) => {
    onSelectDate(metadata.id);
    if (metadata.isDifferentMonth) {
      onMonthChange(toDateId(startOfMonth(metadata.date)));
    }
  };

  const goToMonth = (delta: number) => {
    const current = fromDateId(calendarMonthId);
    onMonthChange(
      toDateId(new Date(current.getFullYear(), current.getMonth() + delta, 1)),
    );
  };

  return (
    <View className="items-center">
      {/* Month Row */}
      <View className="w-full flex-row items-center justify-between pt-4">
        <Text className="text-grey-50 text-body-lg-medium">
          {calendarRowMonth}
        </Text>
        <View className="flex-row">
          <Pressable
            onPress={() => goToMonth(-1)}
            className="h-[34px] w-[34px] items-center justify-center"
          >
            <ChevronLeft size={20} color={colors.grey[200]} />
          </Pressable>
          <Pressable
            onPress={() => goToMonth(1)}
            className="h-[34px] w-[34px] items-center justify-center"
          >
            <ChevronRight size={20} color={colors.grey[100]} />
          </Pressable>
        </View>
      </View>

      <View className="w-full pt-2.5">
        <Calendar.Row.Week>
          {weekDaysList.map((weekDay, i) => (
            <Calendar.Item.WeekName
              key={i}
              height={24}
              theme={theme.itemWeekName}
            >
              {weekDay}
            </Calendar.Item.WeekName>
          ))}
        </Calendar.Row.Week>

        {weeksList.map((week, index) => (
          <Calendar.Row.Week key={index}>
            {week.map((dayProps) => (
              <Calendar.Item.Day.WithContainer
                key={dayProps.id}
                metadata={dayProps}
                onPress={() => handleDayPress(dayProps)}
                dayHeight={DAY_HEIGHT}
                daySpacing={0}
                theme={theme.itemDay}
              >
                {dayProps.displayLabel}
              </Calendar.Item.Day.WithContainer>
            ))}
          </Calendar.Row.Week>
        ))}
      </View>
    </View>
  );
}
