import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-[#404040] bg-[#3C3C3C] px-4 py-2 text-base text-[#E0E0E0] placeholder:text-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
