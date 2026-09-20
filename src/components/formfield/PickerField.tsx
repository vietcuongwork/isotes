import { cn } from "@/utils/cn";
import { TouchableOpacity } from "react-native";
import FieldBox from "./FieldBox";
import FieldShell from "./FieldShell";

const DEFAULT_BOX = "bg-grey-925 p-4";

interface PickerFieldProps {
  label: string;
  optionalLabel?: string;
  error?: string;
  shakeTrigger?: number;
  /** is the picker's sheet/dropdown open — drives the FieldBox accent look */
  open?: boolean;
  onPress: () => void;
  /** FieldShell wrapper className, e.g. "flex-1" */
  className?: string;
  /** FieldBox className — height / background / padding, varies per picker */
  boxClassName?: string;
  /** override the open-state look (default: the picker accent) */
  activeClassName?: string;
  /** the row/body — each picker designs its own */
  children: React.ReactNode;
}

export default function PickerField(props: PickerFieldProps) {
  const {
    label,
    optionalLabel,
    error,
    shakeTrigger,
    open = false,
    onPress,
    className,
    boxClassName,
    activeClassName,
    children,
  } = props;

  return (
    <FieldShell
      label={label}
      {...(optionalLabel && { optionalLabel: optionalLabel })}
      error={error}
      shakeTrigger={shakeTrigger}
      className={className}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <FieldBox
          active={open}
          error={!!error}
          activeClassName={activeClassName}
          className={cn(DEFAULT_BOX, boxClassName)}
        >
          {children}
        </FieldBox>
      </TouchableOpacity>
    </FieldShell>
  );
}
