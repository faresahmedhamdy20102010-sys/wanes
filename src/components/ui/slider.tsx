import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min],
    [value, defaultValue, min]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-slate-800/80 data-[orientation=horizontal]:h-3.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3.5 border border-white/10 shadow-inner"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#06B6D4] data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-6 shrink-0 rounded-full border-2 border-white bg-[#0F172A] ring-4 ring-[#3B82F6]/30 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3B82F6] cursor-grab active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
