import { Trip } from "@/types/TCreateTrip";
import { Member } from "@/types/TExpense";

export interface TripSummary {
  balance: number;
  expenseCount: number;
  totalAmount: number;
}

// One trip card's data on the Trips screen, after the transform functions
export interface TripCardData extends TripSummary {
  trip: Trip;
  members: Member[];
}
