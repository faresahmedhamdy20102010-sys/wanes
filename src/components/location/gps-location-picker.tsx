import * as React from "react"
import {
  MapPin,
  LocateFixed,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Navigation,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  getLiveGPSCoordinates,
  reverseGeocodeCoordinates,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsDirectionsUrl,
} from "@/lib/location"

export interface GPSLocationPickerProps {
  value: string
  latitude?: number | null
  longitude?: number | null
  onChange: (address: string, coords?: { latitude: number; longitude: number } | null) => void
  placeholder?: string
  required?: boolean
  urgentMode?: boolean
  className?: string
}

export function GPSLocationPicker({
  value,
  latitude,
  longitude,
  onChange,
  placeholder = "Enter street address, building, or area...",
  required = false,
  urgentMode = false,
  className = "",
}: GPSLocationPickerProps) {
  const [detecting, setDetecting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [accuracy, setAccuracy] = React.useState<number | null>(null)
  const [showMap, setShowMap] = React.useState(Boolean(latitude && longitude))

  React.useEffect(() => {
    if (latitude && longitude) {
      setShowMap(true)
    }
  }, [latitude, longitude])

  async function handleDetectLocation() {
    setErrorMsg(null)
    setDetecting(true)

    try {
      const coords = await getLiveGPSCoordinates()
      setAccuracy(coords.accuracy || 12)

      toast.info("GPS coordinates acquired. Resolving street address...", { duration: 2000 })
      const address = await reverseGeocodeCoordinates(coords.latitude, coords.longitude)

      onChange(address, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      })

      setShowMap(true)
      toast.success("Live GPS verified and pinned on Google Maps!")
    } catch (err: any) {
      const message = err?.message || "Failed to retrieve location. Please check browser permissions."
      setErrorMsg(message)
      toast.error(message)
    } finally {
      setDetecting(false)
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value
    if (!text.trim()) {
      onChange("", null)
      setShowMap(false)
    } else {
      onChange(text, latitude && longitude ? { latitude, longitude } : null)
    }
  }

  function handleClearCoords() {
    onChange(value, null)
    setShowMap(false)
    setAccuracy(null)
  }

  const hasCoords = Boolean(latitude && longitude)
  const embedUrl = hasCoords
    ? buildGoogleMapsEmbedUrl(latitude!, longitude!, 16)
    : value.trim()
    ? `https://maps.google.com/maps?q=${encodeURIComponent(value.trim())}&hl=en&z=15&output=embed`
    : null

  const externalMapUrl = hasCoords
    ? buildGoogleMapsDirectionsUrl(latitude!, longitude!)
    : value.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value.trim())}`
    : "#"

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <MapPin
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 size-4 transition-colors ${
              hasCoords
                ? urgentMode
                  ? "text-[#EF4444]"
                  : "text-[#3B82F6]"
                : "text-[#94A3B8]"
            }`}
          />
          <Input
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            required={required}
            className={`pl-10 pr-24 rounded-xl border text-sm transition-all ${
              hasCoords
                ? urgentMode
                  ? "border-[#EF4444]/40 bg-[#EF4444]/[0.04] text-[#F8FAFC]"
                  : "border-[#3B82F6]/40 bg-[#3B82F6]/[0.04] text-[#F8FAFC]"
                : "border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8]"
            }`}
          />

          {hasCoords && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <span className="flex size-2 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#059669] pr-1">GPS Locked</span>
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting}
          className={`relative group overflow-hidden h-10 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer gap-2 transition-all shadow-md ${
            urgentMode
              ? "border border-[#EF4444]/50 bg-[#EF4444] hover:bg-red-600 text-white shadow-[#EF4444]/20"
              : "border border-[#3B82F6]/40 bg-[#3B82F6] hover:bg-blue-600 text-white shadow-[#3B82F6]/20"
          }`}
          title="Detect live GPS coordinates via browser location"
        >
          {detecting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Locating Satellites...</span>
            </>
          ) : (
            <>
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-white"></span>
              </span>
              <LocateFixed className="size-3.5 group-hover:rotate-45 transition-transform" />
              <span>Detect My Location</span>
            </>
          )}
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 p-2.5 rounded-xl animate-in fade-in">
          <AlertTriangle className="size-4 shrink-0 text-[#EF4444]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showMap && embedUrl && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-3 space-y-2.5 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-[#059669]" />
              <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Navigation className="size-3 text-[#059669]" />
                Google Maps Confirmation
              </span>
              {hasCoords && accuracy && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-[#059669]/30 bg-[#059669]/10 text-[#059669] px-1.5 py-0"
                >
                  &plusmn;{accuracy}m accuracy
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={externalMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] hover:text-[#06B6D4] transition-colors"
                title="Open location on Google Maps full app"
              >
                <span>Open in Maps</span>
                <ExternalLink className="size-3" />
              </a>

              {hasCoords && (
                <button
                  type="button"
                  onClick={handleClearCoords}
                  className="text-[11px] text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                  title="Remove coordinates"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0F172A] shadow-inner">
            <iframe
              title="Google Maps Location Preview"
              src={embedUrl}
              className="size-full border-0 filter brightness-[0.92] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg border border-white/10 bg-[#0F172A]/90 px-2.5 py-1 text-[10px] text-[#94A3B8] backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <MapPin className="size-3 text-[#3B82F6]" />
              <span className="truncate max-w-[200px]">
                {hasCoords
                  ? `${latitude!.toFixed(4)}°, ${longitude!.toFixed(4)}°`
                  : value || "Pinned location"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#94A3B8] px-1 leading-snug">
            {hasCoords
              ? "✓ Verified coordinates will be shared with your matched companion for one-tap GPS navigation."
              : "Tip: Click 'Detect My Location' for automatic turn-by-turn navigation for your helper."}
          </p>
        </div>
      )}
    </div>
  )
}
