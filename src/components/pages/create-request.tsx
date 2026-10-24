import * as React from "react"
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  Heart,
  ShoppingBag,
  Smartphone,
  Accessibility,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
} from "lucide-react"
import { supabase, type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Navbar } from "@/components/sections/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { GPSLocationPicker } from "@/components/location/gps-location-picker"
import { saveSharedRequest, createAssistanceRequestEntity } from "@/lib/requests-store"

const categories: { value: RequestCategory; label: string; icon: React.ReactNode }[] = [
  { value: "senior_care", label: "Senior Care", icon: <Heart className="size-5" /> },
  { value: "daily_errands", label: "Daily Errands", icon: <ShoppingBag className="size-5" /> },
  { value: "tech_setup", label: "Tech Setup", icon: <Smartphone className="size-5" /> },
  { value: "mobility_assistance", label: "Mobility Assistance", icon: <Accessibility className="size-5" /> },
  { value: "emergency_sos", label: "Emergency SOS", icon: <AlertCircle className="size-5" /> },
]

const urgencies: { value: RequestUrgency; label: string; color: string }[] = [
  { value: "normal", label: "Scheduled ($10)", color: "bg-white/[0.08] text-[#94A3B8] border border-white/[0.08]" },
  { value: "high", label: "Priority ($15)", color: "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30" },
  { value: "critical", label: "Instant On-Demand ($25)", color: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" },
]

export function CreateRequestPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const { navigate, params } = useRouter()
  const [title, setTitle] = React.useState("")
  const [category, setCategory] = React.useState<RequestCategory>("daily_errands")
  const [urgency, setUrgency] = React.useState<RequestUrgency>("normal")
  const [description, setDescription] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [listening, setListening] = React.useState(false)

  const recognitionRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!authLoading && !session) {
      toast.info("Please sign in to create a request.")
      navigate("signin")
    }
  }, [authLoading, session, navigate])

  React.useEffect(() => {
    if (params.title) setTitle(params.title)
    if (params.description) setDescription(params.description)
    if (params.category) setCategory(params.category as RequestCategory)
    if (params.urgency) setUrgency(params.urgency as RequestUrgency)
  }, [params])

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  function toggleVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser.")
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setDescription(transcript)
    }

    recognition.onerror = () => {
      toast.error("Voice input failed. Please try again or type manually.")
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    toast.info("Listening... speak your request description.")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!session) {
      toast.info("Please sign in to create a request.")
      navigate("signin")
      return
    }

    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const reqEntity = createAssistanceRequestEntity({
        requester_id: session.user.id,
        requester_name: profile?.full_name || session.user.email?.split("@")[0] || "Client Requester",
        requester_gender: profile?.gender || null,
        title: title.trim(),
        category,
        urgency,
        description: description.trim(),
        location_text: location.trim() || "Cairo, Egypt",
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        status: "open",
        payout_amount: urgency === "critical" ? 625 : 250,
        escrow_amount: urgency === "critical" ? 500 : 200,
        is_paid: true,
      })

      saveSharedRequest(reqEntity)

      try {
        const { error } = await supabase.from("assistance_requests").insert({
          id: reqEntity.id,
          requester_id: reqEntity.requester_id,
          requester_name: reqEntity.requester_name,
          requester_gender: reqEntity.requester_gender,
          title: reqEntity.title,
          category: reqEntity.category,
          urgency: reqEntity.urgency,
          description: reqEntity.description,
          location_text: reqEntity.location_text,
          latitude: reqEntity.latitude,
          longitude: reqEntity.longitude,
          status: "open",
          payout_amount: reqEntity.payout_amount,
          escrow_amount: reqEntity.escrow_amount,
          is_paid: true,
        })

        if (error) {
          console.warn("Supabase insert note:", error.message)
        }

        await supabase.from("notifications").insert({
          user_id: session.user.id,
          type: "request",
          title: "Request Posted",
          message: `Your request "${title.trim()}" has been posted to nearby volunteers.`,
          is_read: false,
        })
      } catch (dbErr) {
        console.warn("DB notification fallback note:", dbErr)
      }

      toast.success("Your request has been posted! Volunteers and companions can now accept it.")
      navigate("dashboard")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar onOpenRequestModal={() => navigate("home")} onOpenVoiceAssistant={() => {}} />
      <div className="pt-20">
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              Post a Request
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Create Assistance Request
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground text-balance">
              Describe what you need help with, and we'll match you with a verified volunteer nearby.
            </p>
          </div>

          <Card className="glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#1E293B]/85 border-white/[0.08] backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="req-title" className="text-xs text-[#94A3B8]">Title</FieldLabel>
                <Input
                  id="req-title"
                  placeholder="e.g. Grocery shopping help needed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-invalid={!!errors.title}
                  className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                />
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </Field>

              <Field>
                <FieldLabel className="text-xs text-[#94A3B8]">Category</FieldLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        category === c.value
                          ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#3B82F6]"
                          : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:border-[#3B82F6]/30 hover:text-[#F8FAFC]"
                      }`}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel className="text-xs text-[#94A3B8]">Urgency Level</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {urgencies.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-all cursor-pointer text-center ${
                        urgency === u.value
                          ? `border-transparent ${u.color}`
                          : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:border-[#3B82F6]/30 hover:text-[#F8FAFC]"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                {urgency === "critical" ? (
                  <FieldDescription className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1 text-xs">
                    ⚡ On-Demand Instant Dispatch Tier: $25 Rate ($20 directly to helper escrow, $5 platform fee). Immediate real-time matching.
                  </FieldDescription>
                ) : (
                  <FieldDescription className="text-[#94A3B8] text-xs">
                    Standard Scheduled Service: $10 Base Rate ($8 companion escrow / $2 platform fee).
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!errors.description}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="req-desc" className="text-xs text-[#94A3B8]">Description</FieldLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleVoiceInput}
                    className={`gap-1.5 ${listening ? "text-[#EF4444]" : "text-[#3B82F6]"}`}
                  >
                    {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                    {listening ? "Stop" : "Voice Input"}
                  </Button>
                </div>
                <Textarea
                  id="req-desc"
                  placeholder="Describe what you need help with... or use voice input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-invalid={!!errors.description}
                  className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                  rows={5}
                />
                {errors.description && <FieldError>{errors.description}</FieldError>}
                {listening && (
                  <FieldDescription className="flex items-center gap-1.5 text-[#3B82F6]">
                    <span className="size-2 animate-pulse rounded-full bg-[#3B82F6]" />
                    Listening...
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="req-loc" className="text-xs text-[#94A3B8]">Service Location &amp; Live GPS</FieldLabel>
                <GPSLocationPicker
                  value={location}
                  latitude={coords?.latitude}
                  longitude={coords?.longitude}
                  onChange={(newAddr, newCoords) => {
                    setLocation(newAddr)
                    setCoords(newCoords || null)
                  }}
                  placeholder="e.g. 123 Main St, Downtown or click Detect My Location"
                />
              </Field>

              <div className="rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-4 flex items-start gap-3 text-xs">
                <ShieldCheck className="size-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#3B82F6]">
                    Strict Same-Gender Policy
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed">
                    {profile?.gender === "male"
                      ? "Your request is registered as Male. Under Wanes's safety rules, only verified Male companions can view and accept this task."
                      : profile?.gender === "female"
                      ? "Your request is registered as Female. Under Wanes's safety rules, only verified Female companions can view and accept this task."
                      : "Safety policy: Male clients match exclusively with male companions, and female clients with female companions."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#0F172A]/60 p-4 flex items-start gap-3 text-xs">
                <MessageSquare className="size-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#F8FAFC]">
                    Mutual Rate &amp; Terms Negotiation Supported
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed text-xs">
                    After posting, you and prospective helpers can easily converse, propose slight rate adjustments, or refine hours directly inside your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
                  onClick={() => navigate("dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-semibold gap-1.5 shadow-sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="size-4" />
                      Post Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

