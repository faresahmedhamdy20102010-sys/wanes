import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[#3B82F6]/15 text-[#06B6D4] border border-[#06B6D4]/30 shadow-xs",
        secondary:
          "bg-white/[0.05] text-[#94A3B8] border border-white/[0.08] font-medium",
        destructive:
          "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shadow-xs",
        success:
          "bg-[#059669]/15 text-[#059669] border border-[#059669]/30 shadow-xs",
        outline:
          "border border-[#06B6D4]/25 bg-[#1E293B] text-[#F8FAFC] backdrop-blur-md",
        ghost: "hover:bg-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]",
        link: "text-[#3B82F6] hover:text-[#06B6D4] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
