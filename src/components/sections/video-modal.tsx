import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

type VideoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoModal({ open, onOpenChange }: VideoModalProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card overflow-hidden p-0 sm:max-w-3xl border-[#06B6D4]/30 bg-[#1E293B]" showCloseButton>
        <DialogTitle className="sr-only">Wanes Story Video</DialogTitle>
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-[#0F172A]">
          {open && (
            <video
              ref={videoRef}
              loop
              playsInline
              controls
              autoPlay
              preload="auto"
              className="size-full object-cover"
            >
              <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#3B82F6]/20 border border-[#06B6D4]/30 px-2.5 py-0.5 text-xs font-semibold text-[#06B6D4]">
              Impact Documentary
            </span>
            <span className="text-xs text-[#94A3B8]">HD 1080p</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-[#F8FAFC]">The Wanes Story</h3>
          <p className="mt-2 text-sm text-[#94A3B8] text-balance">
            See how Wanes is transforming community care — connecting generations
            through trust, safety, and mutual aid. Real stories from real people
            whose lives have been changed by the power of community.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
