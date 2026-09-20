import {
  Bed,
  Car,
  ReceiptText,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  Utensils,
} from "lucide-react-native";
import { Activity } from "../../types/TExpense";

//NOTE - order = grid order in ACTIVITYPicker (2 cols, top-to-bottom then wrap)
export const ACTIVITIES: Activity[] = [
  { id: "lodging", label: "Lodging", Icon: Bed },
  { id: "food", label: "Food", Icon: Utensils },
  { id: "transport", label: "Transport", Icon: Car },
  { id: "activities", label: "Activities", Icon: Ticket },
  { id: "groceries", label: "Groceries", Icon: ShoppingCart },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag },
  { id: "fees", label: "Fees", Icon: ReceiptText },
  { id: "other", label: "Other", Icon: Shapes },
];
