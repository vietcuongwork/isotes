import { getAllTripsWithMembersAndExpenses } from "@/db/trips";
import {
  transformExpenseRow,
  transformMemberRow,
  transformTripRow,
} from "@/features/expense/helpers/expenseHelpers";
import { computeTripBalance } from "@/features/onboarding/helpers/onboardingHelpers";
import { EXPO_ROUTER } from "@/navigation/route";
import { Trip } from "@/types/TCreateTrip";
import { Member } from "@/types/TExpense";
import { TripSummary } from "@/types/TOnboarding";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import TripItem from "./TripItem";

const EMPTY_SUMMARY: TripSummary = {
  balance: 0,
  expenseCount: 0,
  totalAmount: 0,
};

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripSummaries, setTripSummaries] = useState<
    Record<string, TripSummary>
  >({});
  const [tripMembers, setTripMembers] = useState<Record<string, Member[]>>(
    {},
  );
  const [isGettingTrips, setIsGettingTrips] = useState<boolean>(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setIsGettingTrips(true);
      getAllTripsWithMembersAndExpenses()
        .then((rows) => {
          const summaries: Record<string, TripSummary> = {};
          const members: Record<string, Member[]> = {};

          for (const row of rows) {
            const transformedMembers = row.members.map(transformMemberRow);
            const transformedExpenses = row.expenses.map(transformExpenseRow);
            const owner = transformedMembers.find((member) => member.isOwner);

            summaries[row.id] = {
              balance: owner
                ? computeTripBalance(transformedExpenses, owner.id)
                : 0,
              expenseCount: transformedExpenses.length,
              totalAmount: transformedExpenses.reduce(
                (sum, expense) => sum + expense.amount,
                0,
              ),
            };
            members[row.id] = transformedMembers;
          }

          setTrips(rows.map(transformTripRow));
          setTripSummaries(summaries);
          setTripMembers(members);
        })
        .finally(() => setIsGettingTrips(false));
    }, []),
  );

  return (
    <View className="gap-3 border-b border-grey-825 pb-8 pt-7">
      {/* Item */}
      {trips.map((trip) => (
        <TripItem
          key={trip.id}
          trip={trip}
          summary={tripSummaries[trip.id] ?? EMPTY_SUMMARY}
          members={tripMembers[trip.id] ?? []}
          touchableOpacityProps={{
            onPress: () => {
              router.push(EXPO_ROUTER.EXPENSE(trip.id));
            },
          }}
        />
      ))}
    </View>
  );
}
