import * as React from "react"
import { Navbar } from "@/components/sections/navbar"
import { Footer } from "@/components/sections/footer"
import { CheckoutModal } from "@/components/checkout/checkout-modal"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Lock, Check } from "lucide-react"

export function CheckoutPage() {
  const { params, navigate } = useRouter()
  const [modalOpen, setModalOpen] = React.useState(true)

  const planName =
    params.plan === "enterprise"
      ? "Enterprise Institutional Plan"
      : params.plan === "premium" || params.plan === "large"
      ? "Premium Plan (30 Services/mo)"
      : params.plan === "pro" || params.plan === "standard" || params.plan === "small"
      ? "Pro Plan (15 Services/mo)"
      : params.plan === "ondemand"
      ? "Individual Standard Service (On-Demand)"
      : params.plan === "custom"
      ? `Custom Care Plan (${params.services || 20} Services/mo)`
      : "Pro Plan (15 Services/mo)"

  const amount = params.amount
    ? Number(params.amount)
    : params.plan === "enterprise"
    ? 1700
    : params.plan === "premium" || params.plan === "large"
    ? 300
    : params.plan === "pro" || params.plan === "standard" || params.plan === "small"
    ? 150
    : params.plan === "ondemand"
    ? 10
    : 150

  return (
    <div className="min-h-svh bg-background flex flex-col justify-between">
      <Navbar onOpenRequestModal={() => navigate("dashboard")} onOpenVoiceAssistant={() => {}} />

      <main className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold text-[#3B82F6]">
            <Lock className="size-3.5" />
            Official Paymob Secure Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Wanes Care Checkout
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-lg mx-auto">
            Complete your order with Cards, Meeza, Mobile Wallets or Instapay. 80% is held safely in escrow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-6 backdrop-blur-xl space-y-4">
            <h3 className="font-bold text-[#F8FAFC] text-lg border-b border-white/[0.08] pb-3">
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Selected Service:</span>
                <strong className="text-[#F8FAFC]">{planName}</strong>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Billing Period:</span>
                <span className="text-[#F8FAFC]">One-time / Monthly</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Escrow Split (80%):</span>
                <span className="text-[#059669] font-semibold">${(amount * 0.80).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Platform & Insurance Fee (20%):</span>
                <span className="text-[#94A3B8]">${(amount * 0.20).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-white/[0.08] text-[#F8FAFC]">
                <span>Total Due:</span>
                <span className="text-[#3B82F6]">${amount}</span>
              </div>
            </div>

            <Button
              onClick={() => setModalOpen(true)}
              className="w-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-bold mt-4 shadow-sm"
            >
              Open Paymob Payment Window
            </Button>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 text-[#059669] font-bold text-base">
              <ShieldCheck className="size-5" />
              <span>The Wanes Escrow Guarantee</span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li className="flex items-start gap-2">
                <Check className="size-4 text-[#059669] shrink-0 mt-0.5" />
                <span>80% of your payment is held in escrow until the companion arrives and you verify sign-off.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="size-4 text-[#059669] shrink-0 mt-0.5" />
                <span>Strict Same-Gender Matching: Verified male-with-male and female-with-female pairing.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="size-4 text-[#059669] shrink-0 mt-0.5" />
                <span>Immediate refund protection in the event of schedule cancellation or emergency.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />

      <CheckoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialPlan={{
          name: planName,
          amount,
          currency: "USD",
          isRecurring: params.plan !== "ondemand",
          description: "Vetted companion care with 80% held safely in Paymob escrow",
        }}
      />
    </div>
  )
}
