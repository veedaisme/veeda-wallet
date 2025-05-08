"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-full bg-white border rounded-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-y-4 sm:gap-x-4 sm:gap-y-0",
        month: "flex flex-col gap-y-4",
        caption: "flex justify-center relative items-center pt-1.5",
        dropdowns: "flex flex-col gap-y-2 w-full mx-12",
        dropdown: "flex",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center absolute inset-x-0 mx-3",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute z-10 left-1",
          (props.captionLayout?.includes("dropdown")) ? "top-8" : "top-1",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute z-10 right-1",
          (props.captionLayout?.includes("dropdown")) ? "top-8" : "top-1",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 aria-selected:bg-accent aria-selected:[&.day-outside]:bg-accent/50",
          props.mode === "range"
            ? "[&.day-range-end]:rounded-r-md [&.day-range-start]:rounded-l-md aria-selected:[&.day-range-end]:rounded-r-md first:aria-selected:rounded-l-md last:aria-selected:rounded-r-md"
            : "aria-selected:rounded-md",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal",
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "day-selected *:bg-primary *:text-primary-foreground *:hover:bg-primary *:hover:text-primary-foreground *:focus:bg-primary *:focus:text-primary-foreground *:opacity-100",
        today: "*:bg-accent *:text-accent-foreground",
        outside:
          "day-outside *:text-muted-foreground *:opacity-50 *:aria-selected:bg-accent/50 *:aria-selected:text-muted-foreground *:aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "day-range-middle *:aria-selected:bg-accent *:aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }: { orientation?: 'left' | 'right' | 'up' | 'down' }) => {
          if (orientation === "left") {
            return <ChevronLeft className="size-4" />;
          }
          if (orientation === "right") {
            return <ChevronRight className="size-4" />;
          }
          // Optional: handle 'up'/'down' or return null/default icon if needed
          // For now, default to right chevron if orientation is 'up', 'down', or undefined
          return <ChevronRight className="size-4" />;
        },
        // If custom dropdowns are needed for captionLayout="dropdown-buttons",
        // a Dropdown component would be passed here from the parent.
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
