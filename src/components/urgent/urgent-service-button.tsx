import * as React from "react"
import {
  Zap,
  Phone,
  ShieldAlert,
  MapPin,
  Heart,
  ShoppingBag,
  Smartphone,
  Loader2,
  Radio,
  ShieldCheck,
  User,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { supabase, type RequestCategory } from "@/lib/supabase"
import { getStoredRecipients } from "@/components/dashboard/care-recipients-dialog"
import { setPendingRequestIntent } from "@/lib/pending-request"
import { liveSync } from "@/lib/live-sync"
import { GPSLocationPicker } from "@/components/location/gps-location-picker"

export type UrgentPreset = {
  id: string
  title: string
  category: RequestCategory
  icon: React.ReactNode
  description: string
  defaultNotes: string
}

const URGENT_PRESETS: UrgentPreset[] = [
  {
    id: "pharmacy",
    title: "Urgent Pharmacy / Meds",
    category: "daily_errands",
    icon: <ShoppingBag className="size-5 text-rose-400" />,
    description: "Emergency chronic medicine, inhaler, insulin, or urgent pain relief pickup.",
    defaultNotes: "Urgent pharmacy pickup required for chronic prescription medication. Nearest pharmacy El-Ezaby / Seif.",
  },
  {
    id: "clinic",
    title: "Hospital & Clinic Escort",
    category: "senior_care",
    icon: <Heart className="size-5 text-red-400" />,
    description: "Immediate ER accompaniment, clinic checkup escort, and ride-along assistance.",
    defaultNotes: "Needs immediate escort and guidance to clinic or emergency room checkup.",
  },
  {
    id: "home_fall",
    title: "Senior Home Care & Fall Check",
    category: "senior_care",
    icon: <ShieldAlert className="size-5 text-orange-400" />,
    description: "Bedside emergency assistance, post-fall checkup, or mobility aid at home.",
    defaultNotes: "Urgent in-home assistance needed for elderly family member. Walking support and well-being check.",
  },
  {
    id: "tech_power",
    title: "Critical Tech & Safety",
    category: "tech_setup",
    icon: <Smartphone className="size-5 text-[#3B82F6]" />,
    description: "Medical device setup, phone communication offline, or emergency tech triage.",
    defaultNotes: "Urgent help setting up medical monitoring device or restoring family emergency contact line.",
  },
]

const QUICK_AREAS = [
  "Degla, Maadi",
  "Zamalek",
  "Heliopolis",
  "New Cairo",
  "Dokki",
  "Mohandessin",
]

export function UrgentServiceButton() {
  const { session, profile } = useAuth()
  const { navigate, route } = useRouter()
  const [open, setOpen] = React.useState(false)

  const userRole = profile?.role || (session?.user?.user_metadata?.role as string)
  const isProvider = userRole === "paid_companion" || userRole === "volunteer"

  if (isProvider) {
    return null
  }

  const [step, setStep] = React.useState<"select" | "details" | "broadcasting">("select")
  const [selectedPreset, setSelectedPreset] = React.useState<UrgentPreset>(URGENT_PRESETS[0])
  const [location, setLocation] = React.useState("Degla, Maadi, Cairo")
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [recipientName, setRecipientName] = React.useState("")
  const [detailsNote, setDetailsNote] = React.useState("")
  const [genderPref, setGenderPref] = React.useState<"male" | "female">("male")
  const [countdown, setCountdown] = React.useState(15 * 60)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    const list = getStoredRecipients()
    if (list.length > 0 && !recipientName) {
      setRecipientName(list[0].name)
    } else if (!recipientName && profile?.full_name) {
      setRecipientName(profile.full_name)
    }

    if (profile?.gender) {
      setGenderPref(profile.gender as "male" | "female")
    }
  }, [profile, recipientName])

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (step === "broadcasting" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => Math.max(0, c - 1))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, countdown])

  React.useEffect(() => {
    function handleUrgentTrigger(e: any) {
      const presetId = e?.detail?.presetId
      if (presetId) {
        const found = URGENT_PRESETS.find((p) => p.id === presetId)
        if (found) {
          setSelectedPreset(found)
          setDetailsNote(found.defaultNotes)
          setStep("details")
        } else {
          setStep("select")
        }
      } else {
        setStep("select")
      }
      setOpen(true)
    }

    window.addEventListener("wanes:open-urgent-service", handleUrgentTrigger)
    window.addEventListener("nova:open-urgent-service", handleUrgentTrigger)
    return () => {
      window.removeEventListener("wanes:open-urgent-service", handleUrgentTrigger)
      window.removeEventListener("nova:open-urgent-service", handleUrgentTrigger)
    }
  }, [])

  function handleOpenModal() {
    setStep("select")
    setDetailsNote(selectedPreset.defaultNotes)
    setOpen(true)
  }

  function handleSelectPreset(preset: UrgentPreset) {
    setSelectedPreset(preset)
    setDetailsNote(preset.defaultNotes)
    setStep("details")
  }

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const urgentTitle = `[URGENT] ${selectedPreset.title} - ${recipientName || "Immediate Care"}`
      const urgentDesc = `${detailsNote || selectedPreset.description} (Target: ${location})`

      if (!session?.user?.id) {
        setPendingRequestIntent({
          title: urgentTitle,
          category: selectedPreset.category,
          urgency: "critical",
          description: urgentDesc,
          location_text: location,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          recipientName: recipientName || undefined,
        })
        toast.info("Please sign in to activate priority dispatch. Your emergency draft is safely saved.")
        setOpen(false)
        navigate("signin")
        return
      }

      const { data: insertedData } = await supabase
        .from("assistance_requests")
        .insert({
          requester_id: session.user.id,
          requester_name: profile?.full_name || "Emergency Requester",
          requester_gender: genderPref,
          care_recipient_name: recipientName || null,
          title: urgentTitle,
          category: selectedPreset.category,
          urgency: "critical",
          description: urgentDesc,
          location_text: location,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          payout_amount: 300,
          escrow_amount: 255,
          is_paid: true,
          status: "open",
        })
        .select()
        .single()

      liveSync.broadcast({
        type: "request_created",
        requestId: insertedData?.id,
      })

      setStep("broadcasting")
      setCountdown(14 * 60 + 58)
      toast.success(
        "Priority emergency broadcast activated! Nearby verified companions alerted."
      )
    } catch (err) {
      console.error(err)
      toast.error("Failed to trigger broadcast. Please call our 24/7 hotline.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <div
        className={`fixed bottom-5 sm:bottom-6 ${
          route === "dashboard" ? "left-4 sm:left-6 lg:left-[19.5rem]" : "left-4 sm:left-6"
        } z-40 flex items-center transition-all duration-300 ${
          open ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
        }`}
      >
        <button
          type="button"
          onClick={handleOpenModal}
          className="group relative flex items-center gap-2.5 sm:gap-3 rounded-full bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#B91C1C] py-2.5 pl-3.5 pr-4 sm:py-3 sm:pl-4 sm:pr-5 text-white shadow-[0_10px_35px_-5px_rgba(239,68,68,0.5),0_0_20px_rgba(239,68,68,0.25)] border border-white/20 transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_14px_45px_-5px_rgba(239,68,68,0.7),0_0_25px_rgba(239,68,68,0.4)] active:scale-[0.97] cursor-pointer focus:outline-none backdrop-blur-md"
          title="Open Urgent Fast-Track Service Flow"
          aria-label="Request Urgent Service"
        >
          <div className="relative flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
            <Zap className="size-4 sm:size-5 fill-white text-white animate-pulse" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display text-xs sm:text-sm font-extrabold tracking-tight text-white leading-none">
                Urgent Service
              </span>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-rose-100 uppercase mt-0.5">
              Fast-Track &middot; &lt; 15 Min
            </span>
          </div>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border-[#EF4444]/30 bg-[#1E293B] p-0 text-[#F8FAFC] backdrop-blur-2xl shadow-2xl sm:rounded-3xl overflow-hidden">
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#EF4444]/15 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-[#EF4444]/10 blur-[100px]" />

          <div className="border-b border-white/[0.08] p-6 sm:p-7 relative">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EF4444]/30 bg-[#EF4444]/15 px-3 py-1 text-xs font-bold text-[#EF4444]">
                <Zap className="size-3.5 fill-[#EF4444] text-[#EF4444] animate-pulse" />
                Priority Dispatch Desk
              </span>
              <span className="text-xs text-[#94A3B8]">
                &middot; Rapid Response Unit
              </span>
            </div>

            <DialogTitle className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
              {step === "broadcasting"
                ? "Urgent Broadcast Active"
                : "Request Urgent Assistance"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              {step === "broadcasting"
                ? "Your critical dispatch request is being broadcasted to all nearby vetted companions."
                : "Fast-track emergency intake. Verified local companions will be alerted immediately."}
            </DialogDescription>
          </div>

          <div className="p-6 sm:p-7 max-h-[460px] overflow-y-auto space-y-6">
            {step === "select" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="font-semibold text-[#F8FAFC]">
                    Select Your Urgent Need:
                  </span>
                  <span>Step 1 of 2</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {URGENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group flex flex-col justify-between text-left rounded-2xl border border-white/[0.08] bg-[#0F172A]/60 p-4 transition-all duration-200 hover:border-[#EF4444]/40 hover:bg-[#EF4444]/[0.05] hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 group-hover:border-[#EF4444]/30 group-hover:bg-[#EF4444]/10 transition-colors">
                            {preset.icon}
                          </div>
                          <span className="text-[10px] font-bold text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity">
                            Select &rarr;
                          </span>
                        </div>
                        <h4 className="font-bold text-[#F8FAFC] text-sm group-hover:text-red-200 transition-colors">
                          {preset.title}
                        </h4>
                        <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A]/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#F8FAFC]">Prefer to Speak by Phone?</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Direct connection to our 24/7 Rapid Emergency Dispatch Desk.
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:18005556682"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-2 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                  >
                    <Phone className="size-3.5" />
                    <span>Call Hotline</span>
                  </a>
                </div>
              </div>
            )}

            {step === "details" && (
              <form onSubmit={handleDispatch} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <button
                    type="button"
                    onClick={() => setStep("select")}
                    className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    &larr; Change Selection
                  </button>
                  <span className="font-semibold text-[#EF4444]">
                    Selected: {selectedPreset.title}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#EF4444]" />
                    <span>Emergency Location &amp; Live GPS *</span>
                  </label>
                  <GPSLocationPicker
                    value={location}
                    latitude={coords?.latitude}
                    longitude={coords?.longitude}
                    onChange={(newAddr, newCoords) => {
                      setLocation(newAddr)
                      setCoords(newCoords || null)
                    }}
                    urgentMode={true}
                    required
                    placeholder="e.g. 14 Degla St, Maadi, Floor 3"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {QUICK_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setLocation(area + ", Cairo")}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                          location.includes(area)
                            ? "border-[#EF4444]/50 bg-[#EF4444]/20 text-[#F8FAFC]"
                            : "border-white/[0.08] bg-[#0F172A]/50 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]/80"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                      <User className="size-3.5 text-[#3B82F6]" />
                      <span>Care Recipient Name</span>
                    </label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Hajj Mahmoud or Self"
                      className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#EF4444]/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-[#059669]" />
                      <span>Same-Gender Preference</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGenderPref("male")}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          genderPref === "male"
                            ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#06B6D4]"
                            : "border-white/[0.08] bg-[#0F172A]/50 text-[#94A3B8] hover:text-[#F8FAFC]"
                        }`}
                      >
                        Male Helper
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenderPref("female")}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          genderPref === "female"
                            ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#06B6D4]"
                            : "border-white/[0.08] bg-[#0F172A]/50 text-[#94A3B8] hover:text-[#F8FAFC]"
                        }`}
                      >
                        Female Helper
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Immediate Situation Notes
                  </label>
                  <Textarea
                    rows={2}
                    value={detailsNote}
                    onChange={(e) => setDetailsNote(e.target.value)}
                    placeholder="Specific notes for the responder (e.g., apartment number, building code, pharmacy receipt)..."
                    className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#EF4444]/60"
                  />
                </div>

                <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#F8FAFC] block flex items-center gap-1.5">
                      <Zap className="size-3.5 fill-amber-400 text-amber-400" />
                      On-Demand Instant Dispatch ($25 / request)
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">
                      $25 Flat Rate &middot; <strong className="text-emerald-400">$20.00 Helper Escrow (80%)</strong> &middot; $5.00 Platform Fee
                    </span>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shrink-0">
                    $25 Instant
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("select")}
                    className="flex-1 rounded-xl border-white/10 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 font-extrabold shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] transition-all cursor-pointer text-xs sm:text-sm gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <Zap className="size-4 fill-slate-950 text-slate-950" />
                        <span>Dispatch Instant Responder ($25 · $20 Escrow)</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === "broadcasting" && (
              <div className="text-center py-4 space-y-6">
                <div className="relative mx-auto flex size-28 items-center justify-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#EF4444]/30 opacity-75" />
                  <span className="absolute inline-flex size-20 animate-pulse rounded-full bg-[#EF4444]/20" />
                  <div className="relative flex size-16 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-xl shadow-[#EF4444]/40">
                    <Radio className="size-8 animate-spin" style={{ animationDuration: "3s" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="rounded-full bg-[#EF4444]/20 px-3 py-1 text-xs font-bold text-[#EF4444] border border-[#EF4444]/30">
                    Live Broadcast Active
                  </span>
                  <h3 className="text-2xl font-black text-[#F8FAFC] pt-2">
                    Alerting Nearby Responders
                  </h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Transmitting priority task to 16 verified companions within a 3.5 km radius of {location}.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EF4444]/30 bg-[#0F172A]/80 p-4 max-w-xs mx-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444]/80">
                    Estimated Match Window
                  </span>
                  <div className="text-3xl font-mono font-black text-[#F8FAFC] mt-0.5">
                    {formatCountdown(countdown)}
                  </div>
                  <span className="text-[11px] text-[#94A3B8] block mt-1">
                    First available companion will accept immediately
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setOpen(false)
                      navigate("dashboard")
                    }}
                    className="w-full sm:w-auto rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-bold text-xs h-10 px-5 cursor-pointer shadow-md shadow-[#3B82F6]/20"
                  >
                    Track in Dashboard &rarr;
                  </Button>

                  <a
                    href="tel:18005556682"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-5 h-10 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                  >
                    <Phone className="size-3.5" />
                    <span>Call Emergency Hotline</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
