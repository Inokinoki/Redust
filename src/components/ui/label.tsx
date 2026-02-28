import * as React from "react";
import { cn } from "../../lib/utils";
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    const baseStyles =
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

    return (
      <label className={cn(baseStyles, className)} ref={ref} {...props} />
    );
  }
);

Label.displayName = "Label";

export { Label };
