import { ExpenseRow } from "@/db/schema";
import { colors } from "@/themes/color";
import { LucideIcon } from "lucide-react-native";

export interface Activity {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export type SplitMethod = ExpenseRow["splitMethod"];

// Source of truth for which colours a member can be assigned. If you add or
// remove a key here (or in color.js's `member`/`memberInk`), also update the
// `memberColor` enum array in src/db/schema.ts by hand — drizzle needs a
// literal tuple there, so it can't be derived from this type at runtime.
export type MemberColor = keyof typeof colors.member;

export interface Member {
  id: string;
  tripId: string;
  name: string;
  isOwner: boolean;
  memberColor: MemberColor;
  createdAt: number;
}

export interface Expense {
  id: string;
  tripId: string;
  paidByMemberId: string;
  amount: number;
  description: string;
  activity: Activity;
  date: string;
  splitMethod: SplitMethod;
  createdAt: number;
}

export interface ExpenseSheetErrors {
  amount: boolean;
  paidByMemberId: boolean;
  split: boolean;
}

export interface SplitSelection {
  equallySelectedMemberIds: string[];
  splitAmounts: Record<string, string>;
  splitShares: Record<string, number>;
}
