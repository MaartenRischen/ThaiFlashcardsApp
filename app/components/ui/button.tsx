import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BB86FC] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#BB86FC] to-[#9B6DD0] text-white hover:from-[#A66EFC] hover:to-[#8B5DC0] border border-[#404040]",
        destructive:
          "bg-red-900 text-[#E0E0E0] hover:bg-red-800 border border-red-800",
        outline:
          "border border-[#404040] bg-[#2C2C2C] hover:bg-[#3C3C3C] text-[#E0E0E0]",
        secondary:
          "bg-[#3C3C3C] text-[#E0E0E0] hover:bg-[#4C4C4C] border border-[#404040]",
        ghost: "hover:bg-[#2C2C2C] hover:text-[#BB86FC] text-[#E0E0E0]",
        link: "text-[#BB86FC] underline-offset-4 hover:underline hover:text-[#A66EFC]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 