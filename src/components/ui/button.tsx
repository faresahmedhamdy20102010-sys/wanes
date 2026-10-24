import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/25 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.985] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#3B82F6] text-[#F8FAFC] hover:bg-[#2563EB] shadow-sm shadow-[#3B82F6]/15 border border-[#06B6D4]/30 hover:shadow-md hover:shadow-black/40",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-md shadow-[#EF4444]/25 border border-[#EF4444]/40 hover:shadow-lg hover:shadow-[#EF4444]/35",
        outline:
          "border border-[#06B6D4]/20 bg-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]/80 hover:border-[#06B6D4]/30 hover:text-white shadow-xs backdrop-blur-md",
        secondary:
          "bg-[#334155]/90 text-[#F8FAFC] hover:bg-[#475569] border border-white/[0.06] shadow-xs",
        ghost:
          "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06]",
        link: "text-[#3B82F6] hover:text-[#06B6D4] underline-offset-4 hover:underline",
        success:
          "bg-[#059669] text-white hover:bg-[#047857] shadow-md shadow-[#059669]/20 border border-[#059669]/40 hover:shadow-lg hover:shadow-[#059669]/30",
      },
      size: {
        default: "h-9.5 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6.5 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8.5 gap-1.5 rounded-lg px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-sm has-[>svg]:px-4 font-bold",
        icon: "size-9.5 rounded-xl",
        "icon-xs": "size-6.5 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8.5 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
