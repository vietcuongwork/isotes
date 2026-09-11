import { cn } from "@/utils/cn";
import { View } from "react-native";

interface FieldBoxProps {
  /** focused (text input) or open (picker) — the "attention" look */
  active?: boolean;
  /** form error look; text/border only, wins over `active` */
  error?: boolean;
  /** the active-state classes; default is the text-input focus look */
  activeClassName?: string;
  /** height, background, padding — varies by field, applied before state */
  className?: string;
  children: React.ReactNode;
}

export default function FieldBox(props: FieldBoxProps) {
  const {
    active = false,
    error = false,
    activeClassName = "border-orange-400",
    className,
    children,
  } = props;

  return (
    <View
      //NOTE - the caller sets height (h-14 for text inputs — load-bearing, see
      //documentation/log/encountered_errors_ii.md) and background via className.
      className={cn(
        "rounded-row border border-grey-815",
        className,
        active && activeClassName,
        error && "border-red-400",
      )}
    >
      {children}
    </View>
  );
}
