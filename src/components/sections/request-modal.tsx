import * as React from "react"
import { Loader2, Send, ShieldCheck, CreditCard, Coins, MessageSquare, Zap } from "lucide-react"
import { supabase, type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { setPendingRequestIntent } from "@/lib/pending-request"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { GPSLocationPicker } from "@/components/location/gps-location-picker"
import { saveSharedRequest, createAssistanceRequestEntity } from "@/lib/requests-store"

type RequestModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillData?: {
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
    recipientName?: string
    location_text?: string
    latitude?: number | null
    longitude?: number | null
  } | null
  onProceedToPaymob?: (draft: {
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
    location_text: string
    latitude?: number | null
    longitude?: number | null
    care_recipient_name?: string | null
    amount: number
  }) => void
}

const categories: { value: RequestCategory; label: string }[] = [
  { value: "senior_care", label: "Senior Care" },
  { value: "daily_errands", label: "Daily Errands" },
  { value: "tech_setup", label: "Tech Setup" },
  { value: "mobility_assistance", label: "Mobility Assistance" },
  { value: "emergency_sos", label: "Emergency SOS" },
]

const urgencies: { value: RequestUrgency; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

export function RequestModal({ open, onOpenChange, prefillData, onProceedToPaymob }: RequestModalProps) {
  const { session, profile } = useAuth()
  const { navigate } = useRouter()
  const [title, setTitle] = React.useState("")
  const [category, setCategory] = React.useState<RequestCategory>("daily_errands")
  const [urgency, setUrgency] = React.useState<RequestUrgency>("normal")
  const [description, setDescription] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (prefillData) {
      setTitle(prefillData.title)
      setCategory(prefillData.category)
      setUrgency(prefillData.urgency)
      setDescription(prefillData.description)
      if (prefillData.location_text) {
        setLocation(prefillData.location_text)
      }
      if (prefillData.latitude && prefillData.longitude) {
        setCoords({ latitude: prefillData.latitude, longitude: prefillData.longitude })
      }
    }
  }, [prefillData])

  React.useEffect(() => {
    if (open && !prefillData) {
      setTitle("")
      setCategory("daily_errands")
      setUrgency("normal")
      setDescription("")
      setLocation("")
      setCoords(null)
      setErrors({})
    }
  }, [open, prefillData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!session) {
      setPendingRequestIntent({
        title,
        category,
        urgency,
        description,
        location_text: location,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
      })
      toast.info("Please sign in or create a client account. Your draft has been safely saved.")
      onOpenChange(false)
      navigate("signin")
      return
    }

    const newErrors: Record<string, string> = {}
    if (!title) newErrors.title = "Title is required"
    if (!description) newErrors.description = "Description is required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const reqEntity = createAssistanceRequestEntity({
        requester_id: session.user.id,
        requester_name: profile?.full_name || session.user.user_metadata?.full_name || "Client",
        care_recipient_name: prefillData?.recipientName || null,
        requester_gender: profile?.gender || null,
        title,
        category,
        urgency,
        description,
        location_text: location || "Cairo, Egypt",
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        status: "open",
        payout_amount: urgency === "critical" ? 625 : 250,
        escrow_amount: urgency === "critical" ? 500 : 200,
        is_paid: true,
      })

      saveSharedRequest(reqEntity)

      try {
        const { data: insertedReq, error } = await supabase
          .from("assistance_requests")
          .insert({
            id: reqEntity.id,
            requester_id: reqEntity.requester_id,
            requester_name: reqEntity.requester_name,
            care_recipient_name: reqEntity.care_recipient_name,
            requester_gender: reqEntity.requester_gender,
            title: reqEntity.title,
            category: reqEntity.category,
            urgency: reqEntity.urgency,
            description: reqEntity.description,
            location_text: reqEntity.location_text,
            latitude: reqEntity.latitude,
            longitude: reqEntity.longitude,
            status: "open",
            payout_amount: urgency === "critical" ? 625 : 250,
            escrow_amount: urgency === "critical" ? 500 : 200,
            is_paid: true,
          })
          .select()
          .single()

        if (error) {
          console.warn("Supabase insert notice (fallback to local shared store):", error.message)
        } else if (insertedReq) {
          saveSharedRequest({ ...reqEntity, ...insertedReq })
        }

        await supabase.from("notifications").insert({
          user_id: session.user.id,
          type: "request",
          title: "Request Posted",
          message: `Your request "${title}" has been broadcast to verified companions and volunteers.`,
          is_read: false,
        })
      } catch (dbErr) {
        console.warn("Non-blocking DB notification note:", dbErr)
      }

      toast.success("Your request has been posted! Companions and volunteers can now accept it.")
      setTitle("")
      setDescription("")
      setLocation("")
      onOpenChange(false)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isInstant = urgency === "critical"
  const visitCost = isInstant ? 625 : 250
  const escrowHold = isInstant ? 500 : 200
  const platformCut = isInstant ? 125 : 50
  const usdRate = isInstant ? 25 : 10
  const usdEscrow = isInstant ? 20 : 8
  const usdFee = isInstant ? 5 : 2

  function handlePaymobProceed() {
    if (!session) {
      toast.info("Please sign in to book a visit.")
      onOpenChange(false)
      navigate("signin")
      return
    }

    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in the required fields.")
      return
    }

    if (onProceedToPaymob) {
      onProceedToPaymob({
        title: title.trim(),
        category,
        urgency,
        description: description.trim(),
        location_text: location.trim(),
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        care_recipient_name: prefillData?.recipientName || null,
        amount: visitCost,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Assistance</DialogTitle>
          <DialogDescription>
            Post a task and get matched with a vetted local volunteer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="req-title">Title</FieldLabel>
            <Input
              id="req-title"
              placeholder="e.g. Grocery shopping help needed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select value={category} onValueChange={(v) => setCategory(v as RequestCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Urgency</FieldLabel>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as RequestUrgency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {urgencies.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {urgency === "critical" && (
              <FieldDescription className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1 text-xs">
                <Zap className="size-3.5 text-amber-400 shrink-0" />
                <span>On-Demand Instant Dispatch Tier: $25 Flat Rate ($20 directly to helper escrow, $5 platform fee). Immediate real-time matching.</span>
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="req-desc">Description</FieldLabel>
            <Textarea
              id="req-desc"
              placeholder="Describe what you need help with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
              rows={4}
            />
            {errors.description && <FieldError>{errors.description}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="req-loc">Service Location &amp; Live GPS</FieldLabel>
            <GPSLocationPicker
              value={location}
              latitude={coords?.latitude}
              longitude={coords?.longitude}
              onChange={(newAddr, newCoords) => {
                setLocation(newAddr)
                setCoords(newCoords || null)
              }}
              placeholder="e.g. 14 Degla St, Maadi, Cairo or click Detect My Location"
            />
          </Field>

          <div className="rounded-xl border border-[#06B6D4]/25 bg-[#1E293B]/90 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <Coins className="size-4 text-[#3B82F6]" />
                <span>{isInstant ? "On-Demand Instant Escrow Breakdown" : "Paymob Escrow Breakdown"}</span>
              </div>
              <Badge className={`${isInstant ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-[#3B82F6]/15 text-[#06B6D4] border-[#06B6D4]/30"} text-[10px] font-bold`}>
                ${usdRate} {isInstant ? "Instant Rate" : "Standard Rate"} ({visitCost} EGP)
              </Badge>
            </div>
            <div className="space-y-1 text-[#94A3B8] text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">80% Companion Escrow Reserve:</span>
                <span className="font-semibold text-[#059669]">
                  ${usdEscrow}.00 ({escrowHold} EGP)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">20% Safety, Insurance &amp; Dispatch:</span>
                <span className="text-[#F8FAFC]">
                  ${usdFee}.00 ({platformCut} EGP)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#94A3B8] pt-0.5 border-t border-white/[0.08]">
              {isInstant
                ? "Dispatched immediately in real-time. $20.00 is locked in Paymob escrow until client sign-off."
                : "Funds are held safely in escrow until you verify and sign off on your companion visit."}
            </p>
          </div>

          <div className="rounded-xl border border-[#06B6D4]/20 bg-[#1E293B]/70 p-3.5 flex items-start gap-2.5 text-xs">
            <MessageSquare className="size-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#F8FAFC]">
                Flexible Terms &amp; Rate Discussion Supported
              </p>
              <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                You and your matched companion can smoothly discuss special conditions, adjustments, or custom rates in your dashboard before the visit starts.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#06B6D4]/25 bg-[#1E293B]/70 p-3.5 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="size-4 text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-[#06B6D4]">
                Same-Gender Safety Rule
              </p>
              <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                {profile?.gender === "male"
                  ? "This request is set for Male clients and will only be accepted by verified Male companions."
                  : profile?.gender === "female"
                  ? "This request is set for Female clients and will only be accepted by verified Female companions."
                  : "Same-gender matching: Male companions assist male clients, female companions assist female clients."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {onProceedToPaymob ? (
              <Button
                type="button"
                onClick={handlePaymobProceed}
                className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-bold h-11 text-xs sm:text-sm gap-2 rounded-xl shadow-lg shadow-[#3B82F6]/25 cursor-pointer"
              >
                <CreditCard className="size-4" />
                Proceed to Paymob ({isInstant ? `$25 Instant · $20 Escrow (${visitCost} EGP)` : `$10 Standard · $8 Escrow (${visitCost} EGP)`})
              </Button>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={onProceedToPaymob ? "secondary" : "default"}
                className={onProceedToPaymob ? "flex-1 text-xs" : "flex-1"}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" />
                    {onProceedToPaymob ? "Post Community Request" : "Post Request"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

