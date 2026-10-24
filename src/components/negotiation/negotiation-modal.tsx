import * as React from "react"

import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Coins,
  Send,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  type NegotiationThread,
  getNegotiationForRequest,
  submitCounterProposal,
  acceptNegotiationProposal,
  declineNegotiation,
} from "@/lib/negotiation"
import { type AssistanceRequest } from "@/lib/supabase"

type NegotiationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: AssistanceRequest | null
  currentRole: "client" | "provider"
  currentUserName?: string
  onTermsAgreed?: (requestId: string, agreedPrice: number, agreedEscrow: number) => void
}

export function NegotiationModal({
  open,
  onOpenChange,
  request,
  currentRole,
  currentUserName = "You",
  onTermsAgreed,
}: NegotiationModalProps) {
  const [thread, setThread] = React.useState<NegotiationThread | null>(null)
  const [isCountering, setIsCountering] = React.useState(false)
  const [counterPrice, setCounterPrice] = React.useState<number>(280)
  const [counterHours] = React.useState<number>(2)
  const [message, setMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open && request) {
      const existing = getNegotiationForRequest(request.id)
      if (existing) {
        setThread(existing)
        setCounterPrice(existing.currentPrice || request.payout_amount || 250)
      } else {
        const basePrice = request.payout_amount || 250
        const defaultThread: NegotiationThread = {
          requestId: request.id,
          requestTitle: request.title,
          category: request.category,
          requesterName: request.care_recipient_name || request.requester_name || "Care Requester",
          currentStatus: "draft",
          originalPrice: basePrice,
          currentPrice: basePrice,
          proposals: [
            {
              id: `init-${request.id}`,
              requestId: request.id,
              senderRole: "client",
              senderName: request.requester_name || "Care Requester",
              proposedPrice: basePrice,
              proposedEscrow: Math.round(basePrice * 0.80 * 10) / 10,
              proposedHours: 2,
              message: request.description || "Initial request terms.",
              status: "pending",
              createdAt: request.created_at || new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        }
        setThread(defaultThread)
        setCounterPrice(basePrice)
      }
      setIsCountering(false)
      setMessage("")
    }
  }, [open, request])

  if (!request) return null

  const isAgreed = thread?.currentStatus === "agreed"
  const isDeclined = thread?.currentStatus === "declined"
  const lastProposal = thread?.proposals[thread.proposals.length - 1]
  const isAwaitingMyAction =
    lastProposal?.status === "pending" &&
    lastProposal.senderRole !== currentRole

  function handleAccept() {
    if (!thread || !lastProposal) return
    setSubmitting(true)
    try {
      const updated = acceptNegotiationProposal(request!.id, lastProposal.id, currentRole)
      if (updated) {
        setThread(updated)
        const agreedAmt = updated.agreedPrice || lastProposal.proposedPrice
        const agreedEscrow = Math.round(agreedAmt * 0.80 * 10) / 10
        if (onTermsAgreed) {
          onTermsAgreed(request!.id, agreedAmt, agreedEscrow)
        }
        toast.success(
          `Offer accepted at ${agreedAmt} EGP! Escrow updated to ${agreedEscrow} EGP.`
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleDecline() {
    if (!thread) return
    const updated = declineNegotiation(request!.id)
    if (updated) {
      setThread(updated)
      toast.info("Negotiation closed without rate change.")
    }
  }

  function handleSubmitCounter(e: React.FormEvent) {
    e.preventDefault()
    if (!thread) return
    if (!counterPrice || counterPrice <= 0) {
      toast.error("Please enter a valid price.")
      return
    }

    setSubmitting(true)
    try {
      const updated = submitCounterProposal(
        request!.id,
        request!.title,
        request!.category,
        request!.requester_name || "Client",
        currentRole,
        currentUserName,
        counterPrice,
        counterHours,
        message || (currentRole === "provider"
          ? "Proposed terms adjustment based on visit scope."
          : "Adjusted budget offer for your consideration."),
        thread.originalPrice
      )
      setThread(updated)
      setIsCountering(false)
      setMessage("")
      toast.success(
        `Proposal of ${counterPrice} EGP sent! Awaiting counterpart response.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const quickPricePresets = [
    Math.max(150, (thread?.originalPrice || 250) - 50),
    thread?.originalPrice || 250,
    (thread?.originalPrice || 250) + 30,
    (thread?.originalPrice || 250) + 60,
    (thread?.originalPrice || 250) + 100,
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/[0.08] bg-[#1E293B]/95 p-0 text-[#F8FAFC] backdrop-blur-2xl shadow-2xl sm:rounded-3xl overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#3B82F6]/10 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-[#059669]/10 blur-[100px]" />

        <div className="border-b border-white/[0.06] p-6 sm:p-7 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#06B6D4]">
                  <HeartHandshake className="size-3" />
                  Terms &amp; Offer Discussion
                </span>
                <span className="text-xs text-[#94A3B8] capitalize">
                  · {request.category.replace(/_/g, " ")}
                </span>
              </div>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] leading-tight">
                {request.title}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#94A3B8]">
                Transparent discussion between client and companion to align on fair pricing and visit scope.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-4">
            {isAgreed ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#059669]/30 bg-[#059669]/10 p-3.5 text-xs text-[#059669] backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4.5 text-[#059669] shrink-0" />
                  <div>
                    <p className="font-bold text-[#F8FAFC]">Terms Mutually Agreed</p>
                    <p className="text-[11px] text-emerald-200/80">
                      Final rate: {thread?.agreedPrice} EGP · 80% Escrow locked ({Math.round((thread?.agreedPrice || 250) * 0.80 * 10) / 10} EGP)
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#059669]/20 text-[#059669] border-[#059669]/30 font-bold">
                  Agreed
                </Badge>
              </div>
            ) : isDeclined ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-[#94A3B8]">
                <AlertCircle className="size-4 shrink-0" />
                <span>Negotiation closed. The original terms stand as posted.</span>
              </div>
            ) : isAwaitingMyAction ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-3.5 text-xs text-blue-200 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4.5 text-[#3B82F6] shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold text-[#F8FAFC]">
                      Action Needed: New Offer Proposed
                    </p>
                    <p className="text-[11px] text-blue-200/80">
                      {lastProposal?.senderName} proposed {lastProposal?.proposedPrice} EGP ({lastProposal?.proposedHours || 2} Hours)
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#3B82F6]/20 text-[#06B6D4] border-[#3B82F6]/30 font-bold">
                  Review Offer
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/5 p-3.5 text-xs text-blue-200/90 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-[#3B82F6] shrink-0" />
                  <div>
                    <p className="font-bold text-[#F8FAFC]">
                      Proposal Sent · Awaiting Response
                    </p>
                    <p className="text-[11px] text-blue-200/70">
                      Waiting for the other party to review your offer of {thread?.currentPrice} EGP
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#3B82F6]/20 text-[#06B6D4] border-[#3B82F6]/30 font-bold">
                  In Discussion
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-6 sm:p-7 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Offer History &amp; Messages
          </p>

          <div className="space-y-3.5">
            {thread?.proposals.map((proposal) => {
              const isMe = proposal.senderRole === currentRole
              return (
                <div
                  key={proposal.id}
                  className={`rounded-2xl border p-4.5 transition-all space-y-2.5 ${
                    proposal.status === "accepted"
                      ? "border-[#059669]/30 bg-[#059669]/[0.08]"
                      : isMe
                      ? "border-[#3B82F6]/30 bg-[#3B82F6]/[0.04] ml-4 sm:ml-8"
                      : "border-white/[0.08] bg-white/[0.02] mr-4 sm:mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        isMe ? "bg-[#3B82F6] text-white" : "bg-white/10 text-[#F8FAFC] border border-white/10"
                      }`}>
                        {proposal.senderRole === "client" ? "C" : "P"}
                      </div>
                      <span className="font-semibold text-[#F8FAFC]">
                        {isMe ? "You" : proposal.senderName}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        ({proposal.senderRole === "client" ? "Client" : "Companion"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(proposal.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-medium ${
                          proposal.status === "accepted"
                            ? "border-[#059669]/40 bg-[#059669]/15 text-[#059669]"
                            : proposal.status === "pending"
                            ? "border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#06B6D4]"
                            : proposal.status === "countered"
                            ? "border-white/10 text-[#94A3B8]"
                            : "border-[#EF4444]/20 text-[#EF4444]"
                        }`}
                      >
                        {proposal.status === "accepted"
                          ? "✓ Agreed"
                          : proposal.status === "pending"
                          ? "Active Offer"
                          : proposal.status === "countered"
                          ? "Countered"
                          : "Declined"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.05] bg-[#0F172A]/60 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl font-extrabold text-[#F8FAFC]">
                        {proposal.proposedPrice}{" "}
                        <span className="text-xs font-semibold text-[#3B82F6]">EGP</span>
                      </span>
                      {proposal.proposedHours && (
                        <span className="text-xs text-[#94A3B8]">
                          · {proposal.proposedHours} Hours
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#059669] flex items-center gap-1">
                      <ShieldCheck className="size-3 text-[#059669]" />
                      80% Companion Escrow: {proposal.proposedEscrow} EGP
                    </span>
                  </div>

                  {proposal.message && (
                    <p className="text-xs text-[#94A3B8] leading-relaxed pl-1">
                      {proposal.message}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/[0.06] bg-[#0F172A]/80 p-6 sm:p-7 relative">
          {isAwaitingMyAction && !isCountering && !isAgreed && !isDeclined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>The counterpart proposed this rate. How would you like to respond?</span>
                <span className="font-semibold text-[#F8FAFC]">
                  Proposed: {lastProposal?.proposedPrice} EGP
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-xl bg-[#059669] hover:bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)] transition-all active:scale-[0.99]"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Accept Offer ({lastProposal?.proposedPrice} EGP)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCountering(true)
                    setCounterPrice(lastProposal?.proposedPrice || 250)
                  }}
                  className="cursor-pointer rounded-xl border-[#3B82F6]/30 bg-[#3B82F6]/10 text-xs sm:text-sm font-semibold text-[#06B6D4] hover:bg-[#3B82F6]/20 hover:text-white"
                >
                  <TrendingUp className="size-4 text-[#3B82F6]" />
                  <span>Counter Offer</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDecline}
                  className="cursor-pointer rounded-xl text-xs text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#DC2626]/10"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {(isCountering || (!isAwaitingMyAction && !isAgreed && !isDeclined)) && (
            <form onSubmit={handleSubmitCounter} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                  <Coins className="size-3.5 text-[#3B82F6]" />
                  <span>Propose Rate (EGP)</span>
                </label>
                {isCountering && isAwaitingMyAction && (
                  <button
                    type="button"
                    onClick={() => setIsCountering(false)}
                    className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0F172A] p-1 flex-1">
                    <button
                      type="button"
                      onClick={() => setCounterPrice((prev) => Math.max(100, prev - 25))}
                      className="size-9 rounded-lg border border-white/5 bg-white/[0.04] text-[#94A3B8] hover:bg-white/10 hover:text-[#F8FAFC] text-sm font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(Number(e.target.value))}
                      className="w-full bg-transparent text-center text-lg font-extrabold text-[#F8FAFC] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCounterPrice((prev) => prev + 25)}
                      className="size-9 rounded-lg border border-white/5 bg-white/[0.04] text-[#94A3B8] hover:bg-white/10 hover:text-[#F8FAFC] text-sm font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#059669]/25 bg-[#059669]/10 px-3.5 py-2 text-right">
                    <span className="text-[10px] text-[#059669] block font-medium">
                      Net 80% Escrow
                    </span>
                    <span className="text-sm font-bold text-[#059669]">
                      {Math.round(counterPrice * 0.80 * 10) / 10} EGP
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#94A3B8] mr-1">Presets:</span>
                  {quickPricePresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCounterPrice(p)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        counterPrice === p
                          ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#06B6D4]"
                          : "border-white/[0.06] bg-white/[0.02] text-[#94A3B8] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {p} EGP
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Textarea
                  placeholder={
                    currentRole === "provider"
                      ? "Add a note (e.g. 'I can bring specialized medical gear, elevator access, or stay an extra 30 mins')..."
                      : "Add a note for the companion regarding your adjusted offer..."
                  }
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#0F172A] text-xs text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#3B82F6]/50"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] py-3 font-semibold text-white shadow-sm shadow-[#3B82F6]/15 transition-all active:scale-[0.99] text-xs sm:text-sm"
              >
                <Send className="size-4" />
                <span>Submit Proposal ({counterPrice} EGP)</span>
              </Button>
            </form>
          )}

          {isAgreed && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <CheckCircle2 className="size-4 text-[#059669]" />
                <span>
                  Terms are officially agreed. Both parties can proceed with the visit safely.
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto bg-white/10 text-[#F8FAFC] hover:bg-white/20 rounded-xl px-5 text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
