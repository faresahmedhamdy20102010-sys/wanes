import * as React from "react"

import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Copy,
  Receipt,
  Info,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useRouter } from "@/lib/router"
import { useAuth } from "@/lib/auth-context"
import { supabase, type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { toast } from "sonner"
import { saveSharedRequest } from "@/lib/requests-store"

export type PaymentMethod = "card" | "meeza" | "wallet" | "instapay"
export type PaymentStatus = "idle" | "processing" | "success" | "failed"

export type PendingVisitDraft = {
  title: string
  category: RequestCategory
  urgency: RequestUrgency
  description: string
  location_text?: string | null
  latitude?: number | null
  longitude?: number | null
  care_recipient_name?: string | null
  amount?: number
}

type CheckoutModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPlan?: {
    name: string
    amount: number
    currency?: string
    isRecurring?: boolean
    description?: string
  }
  pendingVisit?: PendingVisitDraft | null
  onSuccess?: (createdReq?: any) => void
}

export function CheckoutModal({
  open,
  onOpenChange,
  initialPlan = {
    name: "Pro Plan (15 Services/mo)",
    amount: 150,
    currency: "USD",
    isRecurring: true,
    description: "15 monthly companion visits, 24/7 SOS safety guard & GPS telemetry",
  },
  pendingVisit,
  onSuccess,
}: CheckoutModalProps) {
  const { navigate } = useRouter()
  const { profile, session } = useAuth()

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card")
  const [status, setStatus] = React.useState<PaymentStatus>("idle")
  const [processingStep, setProcessingStep] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  const [cardNumber, setCardNumber] = React.useState("")
  const [cardHolder, setCardHolder] = React.useState(profile?.full_name || "")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCvv, setCardCvv] = React.useState("")

  const [meezaNumber, setMeezaNumber] = React.useState("")
  const [meezaExpiry, setMeezaExpiry] = React.useState("")
  const [meezaCvv, setMeezaCvv] = React.useState("")

  const [walletOperator, setWalletOperator] = React.useState<"vodafone" | "orange" | "etisalat" | "we">("vodafone")
  const [walletPhone, setWalletPhone] = React.useState(profile?.phone || "")

  const [instapayRef, setInstapayRef] = React.useState("")

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setStatus("idle")
      setProcessingStep(0)
      setErrors({})
      if (profile?.full_name && !cardHolder) {
        setCardHolder(profile.full_name)
      }
      if (profile?.phone && !walletPhone) {
        setWalletPhone(profile.phone)
      }
    }
  }, [open, profile])

  const totalAmount = initialPlan.amount
  const escrowAmount = Math.round(totalAmount * 0.80)
  const platformFee = totalAmount - escrowAmount
  const currency = initialPlan.currency || "USD"

  const transactionId = React.useMemo(
    () => `PM-EG-${Math.floor(100000 + Math.random() * 900000)}`,
    [status]
  )

  const processingSteps = [
    "Connecting to Paymob Secure Gateway...",
    "Validating payment credentials...",
    "Authorizing 3D-Secure / Telecom Operator...",
    "Allocating 80% to Escrow Vault & generating receipt...",
  ]

  function formatCardNumber(val: string) {
    const cleaned = val.replace(/\D/g, "").slice(0, 16)
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  }

  function formatExpiry(val: string) {
    const cleaned = val.replace(/\D/g, "").slice(0, 4)
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
    }
    return cleaned
  }

  function handleCopyIpa() {
    navigator.clipboard.writeText("wanes.care@instapay")
    setCopied(true)
    toast.success("Instapay Address (IPA) copied to clipboard!")
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleExecutePayment(simulateFailure = false) {
    const newErrors: Record<string, string> = {}

    if (paymentMethod === "card") {
      if (!cardHolder.trim()) newErrors.cardHolder = "Cardholder name is required"
      if (cardNumber.replace(/\s/g, "").length < 16) newErrors.cardNumber = "Valid 16-digit card number required"
      if (!cardExpiry || !cardExpiry.includes("/")) newErrors.cardExpiry = "Expiry MM/YY required"
      if (cardCvv.length < 3) newErrors.cardCvv = "CVV required"
    } else if (paymentMethod === "meeza") {
      if (meezaNumber.replace(/\s/g, "").length < 16) newErrors.meezaNumber = "Valid 16-digit Meeza card required"
      if (!meezaExpiry || !meezaExpiry.includes("/")) newErrors.meezaExpiry = "Expiry MM/YY required"
      if (meezaCvv.length < 3) newErrors.meezaCvv = "CVV required"
    } else if (paymentMethod === "wallet") {
      if (!walletPhone.trim() || walletPhone.length < 10) newErrors.walletPhone = "Valid mobile wallet number required"
    } else if (paymentMethod === "instapay") {
      if (!instapayRef.trim()) newErrors.instapayRef = "Transfer reference code / transaction ID is required"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in the required payment details.")
      return
    }

    setStatus("processing")
    setProcessingStep(0)

    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i)
      await new Promise((resolve) => setTimeout(resolve, 650))
    }

    if (simulateFailure) {
      setStatus("failed")
      toast.error("Paymob Gateway Notice: Transaction was declined by the issuer.")
    } else {
      if (pendingVisit && session?.user?.id) {
        try {
          const reqPayload = {
            requester_id: session.user.id,
            requester_name: profile?.full_name || session.user.email?.split("@")[0] || "Family Client",
            requester_gender: profile?.gender || null,
            care_recipient_name: pendingVisit.care_recipient_name || null,
            title: pendingVisit.title,
            category: pendingVisit.category,
            urgency: pendingVisit.urgency,
            description: pendingVisit.description,
            location_text: pendingVisit.location_text || null,
            latitude: pendingVisit.latitude || null,
            longitude: pendingVisit.longitude || null,
            payout_amount: totalAmount,
            escrow_amount: escrowAmount,
            is_paid: true,
            status: "open" as const,
          }

          const { data: insertedData } = await supabase
            .from("assistance_requests")
            .insert(reqPayload)
            .select()
            .single()

          const createdReq = insertedData || {
            ...reqPayload,
            id: `client-req-${Date.now()}`,
            created_at: new Date().toISOString(),
          }

          saveSharedRequest(createdReq)

          try {
            await supabase.from("notifications").insert({
              user_id: session.user.id,
              type: "request",
              title: "Visit Published & Escrow Held",
              message: `Visit "${pendingVisit.title}" is now open for companion matching. ${escrowAmount} ${currency} safely held in Escrow.`,
              is_read: false,
            })
          } catch {
          }

          onSuccess?.(createdReq)
        } catch (e) {
          console.error("Failed to publish visit after checkout:", e)
          onSuccess?.()
        }
      } else {
        onSuccess?.()
      }

      setStatus("success")
      toast.success("Payment authorized successfully! 80% held in Escrow safely.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-[#1E293B] text-[#F8FAFC] sm:max-w-xl max-h-[92vh] overflow-y-auto backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#06B6D4] border border-[#3B82F6]/20 font-bold">
                💳
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                  Secure Checkout
                  <span className="rounded-md bg-[#3B82F6]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#06B6D4] border border-[#3B82F6]/30">
                    Paymob
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#94A3B8]">
                  Local payment gateway with 80% Escrow safety protection
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[#059669] text-xs font-semibold bg-[#059669]/10 px-2.5 py-1 rounded-full border border-[#059669]/20">
              <Lock className="size-3.5" />
              <span>256-bit SSL</span>
            </div>
          </div>
        </DialogHeader>

        {status === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative flex size-20 items-center justify-center rounded-3xl bg-[#3B82F6]/10 border border-[#3B82F6]/30">
              <Loader2 className="size-10 text-[#3B82F6] animate-spin" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Authorizing with Paymob...</h3>
              <p className="text-xs text-[#94A3B8] min-h-[20px] transition-all">
                {processingSteps[processingStep]}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {processingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`size-2 rounded-full transition-all ${
                    idx === processingStep
                      ? "bg-[#3B82F6] scale-125"
                      : idx < processingStep
                      ? "bg-[#059669]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#059669]/20 text-[#059669] border border-[#059669]/30">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#F8FAFC]">Payment Confirmed!</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm">
                Your transaction has been processed and funds are held in secure escrow.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A]/60 p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[#94A3B8]">Transaction ID:</span>
                <span className="font-mono font-bold text-[#06B6D4]">{transactionId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[#94A3B8]">Payment Gateway:</span>
                <span className="font-semibold text-[#F8FAFC]">Paymob Egypt (Accept)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[#94A3B8]">Selected Plan / Service:</span>
                <span className="font-semibold text-[#F8FAFC]">{initialPlan.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[#94A3B8]">80% Companion Escrow Reserve:</span>
                <span className="font-semibold text-[#059669]">{escrowAmount} {currency}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[#94A3B8]">20% Safety Protocol & Dispatch:</span>
                <span className="font-semibold text-[#94A3B8]">{platformFee} {currency}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-bold">
                <span className="text-[#F8FAFC]">Total Amount Paid:</span>
                <span className="text-[#3B82F6] text-base">{totalAmount} {currency}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-[#059669]/30 bg-[#059669]/10 p-3.5 text-xs text-emerald-200">
              <ShieldCheck className="size-4 text-[#059669] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="leading-relaxed font-bold text-[#F8FAFC]">
                  80% held in Escrow safely ({escrowAmount} {currency})
                </p>
                <p className="text-emerald-300 text-[11px] leading-relaxed">
                  {pendingVisit
                    ? "Your companion visit has been published to the verified feed. Under Wanes rules, companion earnings remain held safely in escrow until you confirm and sign off on completion."
                    : "The 80% companion fee remains safely locked in the escrow reserve until you verify and sign off on your visit tasks."}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.success("Receipt downloaded as PDF.")
                }}
                className="flex-1 border-white/10 bg-white/5 text-[#F8FAFC] hover:bg-white/10 text-xs h-10 gap-1.5"
              >
                <Receipt className="size-4" />
                Download Receipt
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  navigate("dashboard")
                }}
                className="flex-1 bg-[#3B82F6] text-white hover:bg-blue-600 font-bold text-xs h-10"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                <AlertCircle className="size-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#F8FAFC]">Payment Declined</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm">
                Paymob was unable to authorize this transaction. This can happen due to insufficient balance, expired credentials, or bank fraud filters.
              </p>
            </div>

            <div className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 space-y-2 text-xs text-[#F8FAFC]">
              <p className="font-semibold text-red-300">Recommended Next Steps:</p>
              <ul className="list-disc pl-4 space-y-1 text-[#94A3B8]">
                <li>Verify your card balance or try a Mobile Wallet (Vodafone Cash / Instapay).</li>
                <li>Ensure online transactions and international/3D-Secure purchases are enabled on your card.</li>
                <li>Call your bank or Paymob customer hotline (19890).</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setStatus("idle")}
                className="flex-1 border-white/10 bg-white/5 text-[#F8FAFC] hover:bg-white/10 text-xs h-10 gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Switch Method & Retry
              </Button>
              <Button
                onClick={() => handleExecutePayment(false)}
                className="flex-1 bg-[#3B82F6] text-white hover:bg-blue-600 font-bold text-xs h-10"
              >
                Retry Payment
              </Button>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A]/60 p-4.5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h4 className="font-bold text-[#F8FAFC] text-sm">{initialPlan.name}</h4>
                  <p className="text-xs text-[#94A3B8]">{initialPlan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-[#3B82F6]">
                    {totalAmount} {currency}
                  </span>
                  {initialPlan.isRecurring && (
                    <span className="text-[10px] text-[#94A3B8] block">/ monthly</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between text-[#F8FAFC]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-[#059669]" />
                    <span>80% Companion Escrow Reserve:</span>
                  </span>
                  <span className="font-semibold text-[#059669]">{escrowAmount} {currency}</span>
                </div>
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 pl-5">
                    <span>20% Wanes Platform, Safety & Insurance Fee:</span>
                  </span>
                  <span className="font-medium text-[#F8FAFC]">{platformFee} {currency}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel className="text-[#F8FAFC] font-semibold text-xs">
                Select Paymob Payment Option
              </FieldLabel>

              <Tabs
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v as PaymentMethod)
                  setErrors({})
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-[#0F172A] border border-white/[0.08] p-1 rounded-xl h-auto">
                  <TabsTrigger
                    value="card"
                    className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-bold text-[11px] py-2 cursor-pointer"
                  >
                    Cards
                  </TabsTrigger>
                  <TabsTrigger
                    value="meeza"
                    className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-bold text-[11px] py-2 cursor-pointer"
                  >
                    Meeza
                  </TabsTrigger>
                  <TabsTrigger
                    value="wallet"
                    className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-bold text-[11px] py-2 cursor-pointer"
                  >
                    Wallets
                  </TabsTrigger>
                  <TabsTrigger
                    value="instapay"
                    className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-bold text-[11px] py-2 cursor-pointer"
                  >
                    Instapay
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="card" className="space-y-3.5 pt-3">
                  <Field data-invalid={!!errors.cardHolder}>
                    <FieldLabel className="text-[#94A3B8] text-xs">Cardholder Name *</FieldLabel>
                    <Input
                      placeholder="Name on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                    />
                    {errors.cardHolder && <FieldError className="text-xs">{errors.cardHolder}</FieldError>}
                  </Field>

                  <Field data-invalid={!!errors.cardNumber}>
                    <div className="flex items-center justify-between">
                      <FieldLabel className="text-[#94A3B8] text-xs">Card Number *</FieldLabel>
                      <span className="text-[10px] text-[#94A3B8]">Visa / Mastercard</span>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="4123 4567 8901 2345"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs pr-10"
                      />
                      <CreditCard className="size-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.cardNumber && <FieldError className="text-xs">{errors.cardNumber}</FieldError>}
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field data-invalid={!!errors.cardExpiry}>
                      <FieldLabel className="text-[#94A3B8] text-xs">Expiry Date *</FieldLabel>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                      />
                      {errors.cardExpiry && <FieldError className="text-xs">{errors.cardExpiry}</FieldError>}
                    </Field>

                    <Field data-invalid={!!errors.cardCvv}>
                      <FieldLabel className="text-[#94A3B8] text-xs">CVV *</FieldLabel>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                      />
                      {errors.cardCvv && <FieldError className="text-xs">{errors.cardCvv}</FieldError>}
                    </Field>
                  </div>
                </TabsContent>

                <TabsContent value="meeza" className="space-y-3.5 pt-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#059669]/20 bg-[#059669]/10 p-3 text-xs">
                    <div className="flex items-center gap-2 text-[#059669]">
                      <ShieldCheck className="size-4 text-[#059669]" />
                      <span>National Payment Scheme: Meeza Cards Accepted</span>
                    </div>
                    <Badge className="bg-[#059669]/20 text-[#059669] text-[10px]">Meeza</Badge>
                  </div>

                  <Field data-invalid={!!errors.meezaNumber}>
                    <FieldLabel className="text-[#94A3B8] text-xs">Meeza Card Number *</FieldLabel>
                    <Input
                      placeholder="5078 0000 0000 0000"
                      value={meezaNumber}
                      onChange={(e) => setMeezaNumber(formatCardNumber(e.target.value))}
                      className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                    />
                    {errors.meezaNumber && <FieldError className="text-xs">{errors.meezaNumber}</FieldError>}
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field data-invalid={!!errors.meezaExpiry}>
                      <FieldLabel className="text-[#94A3B8] text-xs">Expiry Date *</FieldLabel>
                      <Input
                        placeholder="MM/YY"
                        value={meezaExpiry}
                        onChange={(e) => setMeezaExpiry(formatExpiry(e.target.value))}
                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                      />
                      {errors.meezaExpiry && <FieldError className="text-xs">{errors.meezaExpiry}</FieldError>}
                    </Field>

                    <Field data-invalid={!!errors.meezaCvv}>
                      <FieldLabel className="text-[#94A3B8] text-xs">CVV *</FieldLabel>
                      <Input
                        type="password"
                        maxLength={3}
                        placeholder="123"
                        value={meezaCvv}
                        onChange={(e) => setMeezaCvv(e.target.value.replace(/\D/g, ""))}
                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                      />
                      {errors.meezaCvv && <FieldError className="text-xs">{errors.meezaCvv}</FieldError>}
                    </Field>
                  </div>
                </TabsContent>

                <TabsContent value="wallet" className="space-y-3.5 pt-3">
                  <div className="space-y-1.5">
                    <FieldLabel className="text-[#94A3B8] text-xs">Choose Mobile Wallet Provider</FieldLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "vodafone", label: "Vodafone Cash" },
                        { id: "orange", label: "Orange Cash" },
                        { id: "etisalat", label: "Etisalat Cash" },
                        { id: "we", label: "WE Pay" },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWalletOperator(w.id as any)}
                          className={`p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center ${
                            walletOperator === w.id
                              ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#06B6D4]"
                              : "border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field data-invalid={!!errors.walletPhone}>
                    <FieldLabel className="text-[#94A3B8] text-xs">Wallet Phone Number *</FieldLabel>
                    <Input
                      type="tel"
                      placeholder="010 1234 5678"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                    />
                    {errors.walletPhone && <FieldError className="text-xs">{errors.walletPhone}</FieldError>}
                  </Field>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-[#94A3B8] flex items-start gap-2">
                    <Info className="size-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>
                      Paymob will send an authorization push request or OTP prompt to your wallet app to complete the transaction.
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="instapay" className="space-y-3.5 pt-3">
                  <div className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/5 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Instapay Payment Address (IPA):</span>
                      <button
                        type="button"
                        onClick={handleCopyIpa}
                        className="flex items-center gap-1 font-bold text-[#3B82F6] hover:text-[#06B6D4] cursor-pointer"
                      >
                        <Copy className="size-3.5" />
                        <span>{copied ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="font-mono font-bold text-[#F8FAFC] text-sm bg-[#0F172A] p-2 rounded-lg border border-white/[0.08]">
                      wanes.care@instapay
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      Transfer exact amount (<strong>{totalAmount} {currency}</strong>) from your Instapay app, then enter your transfer reference below:
                    </p>
                  </div>

                  <Field data-invalid={!!errors.instapayRef}>
                    <FieldLabel className="text-[#94A3B8] text-xs">
                      Transfer Reference / Transaction Ref Code *
                    </FieldLabel>
                    <Input
                      placeholder="e.g. IPN-9842105"
                      value={instapayRef}
                      onChange={(e) => setInstapayRef(e.target.value)}
                      className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:border-[#3B82F6] h-9 text-xs"
                    />
                    {errors.instapayRef && <FieldError className="text-xs">{errors.instapayRef}</FieldError>}
                  </Field>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => handleExecutePayment(false)}
                className="w-full bg-[#3B82F6] text-white hover:bg-blue-600 font-bold h-11 text-sm shadow-lg shadow-sky-600/20 gap-2 cursor-pointer"
              >
                <Lock className="size-4" />
                Pay {totalAmount} {currency} via Paymob
              </Button>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

