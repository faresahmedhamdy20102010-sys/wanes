import {
  MapPin,
  ExternalLink,
  Navigation,
  Share2,
  Compass,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
} from "@/lib/location"

export interface MapViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: {
    id?: string
    title: string
    requester_name?: string | null
    care_recipient_name?: string | null
    location_text?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}

export function MapViewDialog({
  open,
  onOpenChange,
  request,
}: MapViewDialogProps) {
  if (!request) return null

  const hasCoords = Boolean(request.latitude && request.longitude)
  const lat = request.latitude || 30.0444
  const lng = request.longitude || 31.2357

  const embedUrl = hasCoords
    ? buildGoogleMapsEmbedUrl(lat, lng, 16)
    : request.location_text
    ? `https://maps.google.com/maps?q=${encodeURIComponent(request.location_text)}&hl=en&z=15&output=embed`
    : buildGoogleMapsEmbedUrl(30.0444, 31.2357, 14)

  const directionsUrl = hasCoords
    ? buildGoogleMapsDirectionsUrl(lat, lng)
    : buildGoogleMapsSearchUrl(lat, lng, request.location_text || undefined)

  function handleShareLocation() {
    if (navigator.share) {
      navigator.share({
        title: `Wanes Care Location: ${request?.title}`,
        text: `Destination: ${request?.location_text || "Client Location"}`,
        url: directionsUrl,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(directionsUrl)
      toast.success("Google Maps destination link copied to clipboard!")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/[0.08] bg-[#1E293B]/95 p-0 text-[#F8FAFC] backdrop-blur-2xl shadow-2xl sm:rounded-3xl overflow-hidden">
        <div className="border-b border-white/[0.08] p-5 sm:p-6 bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#059669]/30 bg-[#059669]/10 px-3 py-1 text-xs font-semibold text-[#059669]">
              <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
              <span>{hasCoords ? "Live GPS Verified Location" : "Address Matched"}</span>
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShareLocation}
              className="h-8 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 gap-1.5 rounded-lg cursor-pointer"
            >
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">Share Link</span>
            </Button>
          </div>

          <DialogTitle className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2">
            <MapPin className="size-5 text-[#3B82F6] shrink-0" />
            <span>{request.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            {request.care_recipient_name
              ? `Client Location for ${request.care_recipient_name} · Prepared for helper navigation`
              : `Service destination for ${request.requester_name || "Client"}`}
          </DialogDescription>
        </div>

        <div className="relative w-full h-[320px] sm:h-[380px] bg-[#0F172A]">
          <iframe
            title="Google Maps Navigation View"
            src={embedUrl}
            className="size-full border-0 filter brightness-[0.95] contrast-[1.05]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="absolute top-3 left-3 z-10 rounded-xl border border-white/10 bg-[#0F172A]/90 px-3 py-1.5 text-xs text-[#F8FAFC] backdrop-blur-md shadow-xl flex items-center gap-2">
            <Compass className="size-3.5 text-[#3B82F6] animate-spin-slow" />
            <span className="font-mono font-medium">
              {hasCoords
                ? `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`
                : request.location_text || "Cairo, Egypt"}
            </span>
          </div>
        </div>

        <div className="border-t border-white/[0.08] p-5 sm:p-6 bg-white/[0.02] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
              Verified Address
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
              {request.location_text || "Cairo, Egypt"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-xs text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl h-10 px-4 cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              size="sm"
              asChild
              className="bg-[#3B82F6] hover:bg-blue-600 font-bold text-white shadow-lg shadow-sky-600/25 rounded-xl h-10 px-5 gap-2 cursor-pointer border border-blue-400/40"
            >
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="size-4 fill-white stroke-none" />
                <span>Start Navigation in Google Maps</span>
                <ExternalLink className="size-3.5 opacity-75" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
