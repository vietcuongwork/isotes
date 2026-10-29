import { colors } from "@/themes/color";
import { fontFamily, textStyle } from "@/themes/typography";
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

// NOTE - no token for the day grid (44 pt cell, 2 pt inset, 1.5 pt ring), falling back to constants; a 40 pt disc leaves a 2 pt margin each side (the library's own padding is 6)
const DAY_HEIGHT = 44;
const DAY_INSET = 2;
const DAY_CIRCLE_RADIUS = 999;
const RING = 1.5;

const micro = textStyle("micro");
const body = textStyle("body");
// weight 600 is a family on this font setup, not fontWeight
const semibold = fontFamily["outfit-semibold"];

const theme: CalendarTheme = {
  itemWeekName: {
    content: { ...micro, color: colors.ink[500] },
  },
  itemDay: {
    idle: ({ isDifferentMonth }) => ({
      container: {
        aspectRatio: 1,
        margin: DAY_INSET,
        borderWidth: RING,
        borderColor: "transparent",
        backgroundColor: "transparent",
      },
      content: {
        ...body,
        fontVariant: ["tabular-nums"],
        color: isDifferentMonth ? colors.ink[300] : colors.ink[900],
      },
    }),
    today: () => ({
      container: {
        aspectRatio: 1,
        margin: DAY_INSET,
        borderRadius: DAY_CIRCLE_RADIUS,
        borderTopLeftRadius: DAY_CIRCLE_RADIUS,
        borderTopRightRadius: DAY_CIRCLE_RADIUS,
        borderBottomLeftRadius: DAY_CIRCLE_RADIUS,
        borderBottomRightRadius: DAY_CIRCLE_RADIUS,
        borderWidth: RING,
        borderColor: colors.ink[900],
        backgroundColor: "transparent",
      },
      content: {
        ...body,
        fontVariant: ["tabular-nums"],
        color: colors.ink[900],
      },
    }),
    // today keeps its ring when it is also the selected day
    active: ({ isToday }) => ({
      container: {
        aspectRatio: 1,
        margin: DAY_INSET,
        borderWidth: RING,
        borderColor: isToday ? colors.ink[900] : "transparent",
        borderRadius: DAY_CIRCLE_RADIUS,
        borderTopLeftRadius: DAY_CIRCLE_RADIUS,
        borderTopRightRadius: DAY_CIRCLE_RADIUS,
        borderBottomLeftRadius: DAY_CIRCLE_RADIUS,
        borderBottomRightRadius: DAY_CIRCLE_RADIUS,
        backgroundColor: colors.shine[100],
      },
      content: {
        ...body,
        fontFamily: semibold,
        fontVariant: ["tabular-nums"],
        color: colors.shine[700],
      },
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
    <View className="items-center gap-space-1">
      {/* Month row */}
      <View className="w-full flex-row items-center justify-between">
        <Text className="text-ink-900 text-heading">{calendarRowMonth}</Text>
        {/* //NOTE - no token, -mr-[10px] is the board's pull so the chevron ink lines up with the sheet edge */}
        <View className="-mr-[10px] flex-row">
          {/* //NOTE - no token, h-[44px] w-[44px] is the board's tap target size */}
          <Pressable
            onPress={() => goToMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            className="h-[44px] w-[44px] items-center justify-center"
          >
            <ChevronLeft size={20} color={colors.ink[900]} />
          </Pressable>
          {/* //NOTE - no token, h-[44px] w-[44px] is the board's tap target size */}
          <Pressable
            onPress={() => goToMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            className="h-[44px] w-[44px] items-center justify-center"
          >
            <ChevronRight size={20} color={colors.ink[900]} />
          </Pressable>
        </View>
      </View>

      {/* Weekdays and days */}
      <View className="w-full">
        <Calendar.Row.Week>
          {weekDaysList.map((weekDay, i) => (
            <Calendar.Item.WeekName
              key={i}
              // NOTE - no token for the 32pt weekday row height, falling back to height={32} (the board's)
              height={32}
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
