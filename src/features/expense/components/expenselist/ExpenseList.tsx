import { View } from "react-native";
import ExpenseItem from "./ExpenseItem";
import ExpenseSeparator from "./ExpenseSeparator";

export default function ExpenseList() {
  return (
    <View className="gap-3 px-5 pt-5">
      <ExpenseSeparator />
      <ExpenseItem />
    </View>
  );
}
