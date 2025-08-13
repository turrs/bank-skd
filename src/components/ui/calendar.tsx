import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  [key: string]: any;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
      <div className="text-center text-sm text-muted-foreground">
        Calendar component - react-day-picker not installed
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
