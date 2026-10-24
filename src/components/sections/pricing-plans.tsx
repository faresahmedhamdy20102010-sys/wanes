import * as React from "react"
import {
  Check,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Lock,
  Headphones,
  Building2,
  CalendarCheck,
  HeartHandshake,
  Users,
  Coins,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "@/lib/router"
import { toast } from "sonner"
import { PricingCalculator } from "@/components/pricing/pricing-calculator"
import { DailyServicesCalculator } from "@/components/pricing/daily-services-calculator"

type PricingTier = {
  id: string
  name: string
  tagline: string
  badge?: string
  description: string
  monthlyPrice: number
  annualPrice: number
  isPopular?: boolean
  isPerService?: boolean
  quotaText: string
  features: string[]
  ctaText: string
  ctaVariant: "default" | "outline" | "amber" | "primary"
  actionType: "ondemand" | "standard" | "premium" | "contact"
}

const tiers: PricingTier[] = [
  {
    id: "standard_service",
    name: "Standard Service (Scheduled)",
    tagline: "Scheduled Pay-As-You-Go Care",
    badge: "$10 Standard Rate",
    description:
      "Ideal for scheduled companion visits, clinic appointments, or planned grocery and errands runs with no monthly commitment.",
    monthlyPrice: 10,
    annualPrice: 10,
    isPerService: true,
    quotaText: "Standard scheduled care ($10 / visit)",
    features: [
      "Guaranteed $10 per standard service visit",
      "80% helper payout ($8.00) / 20% platform fee ($2.00)",
      "Zero monthly contract or ongoing subscription",
      "80% held safely in Paymob escrow until visit sign-off",
      "Vetted university students & background-checked companions",
      "Strict same-gender pairing guaranteed for every home visit",
      "Real-time GPS arrival alerts & live visit status",
    ],
    ctaText: "Book Standard Visit ($10)",
    ctaVariant: "outline",
    actionType: "ondemand",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Essential Recurring Care & Protection",
    badge: "15 Services Quota",
    description:
      "The complete, dependable care package for seniors needing regular weekly visits, companionship, and constant family safety telemetry.",
    monthlyPrice: 150,
    annualPrice: 1500,
    quotaText: "15 services / month included",
    features: [
      "15 services / month quota ($10/service base rate)",
      "Full 24/7 SOS safety protocol access & kin broadcast",
      "Continuous GPS telemetry & real-time visit tracking",
      "24/7 priority dispatch desk & fast companion matching",
      "Family WhatsApp & SMS arrival / departure notifications",
      "Dedicated care recipient profile with custom care instructions",
      "80% Paymob escrow guarantee with automated sign-off",
    ],
    ctaText: "Choose Pro ($150)",
    ctaVariant: "outline",
    actionType: "standard",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Comprehensive Daily Care & Dedicated Companion",
    badge: "Most Popular • 30 Services",
    description:
      "Full daily care and maximum protection with a dedicated primary companion and zero wait times for all family care requests.",
    monthlyPrice: 300,
    annualPrice: 3000,
    isPopular: true,
    quotaText: "30 services / month (Full Daily Care)",
    features: [
      "30 services / month quota (Complete daily care coverage)",
      "Guaranteed $10/service rate ($300/mo total)",
      "Dedicated primary caregiver allocation for consistent familiarity",
      "VIP instant algorithmic matching & zero wait time dispatch",
      "Continuous GPS telemetry & custom geofencing perimeter alerts",
      "24/7 direct operator hotline & dedicated family care coordinator",
      "Multi-family & multi-recipient profiles under single account",
      "Monthly physical & cognitive wellbeing health digest report",
    ],
    ctaText: "Choose Premium ($300)",
    ctaVariant: "primary",
    actionType: "premium",
  },
]

export function PricingPlans() {
  const { navigate } = useRouter()
  const [isAnnual, setIsAnnual] = React.useState(false)
  const [calculatorRole, setCalculatorRole] = React.useState<"client" | "helper">("client")

  function handleAction(tier: PricingTier) {
    if (tier.actionType === "contact") {
      const contactEl = document.getElementById("contact")
      if (contactEl) {
        const navbarHeight = 64
        const elementPosition = contactEl.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight
        window.scrollTo({ top: offsetPosition, behavior: "smooth" })
      } else {
        toast.info("Enterprise Inquiry: Contact our 24/7 dispatch desk below.")
      }
    } else {
      const price = isAnnual && !tier.isPerService ? tier.annualPrice : tier.monthlyPrice
      navigate("checkout", {
        plan: tier.id,
        amount: String(price),
        cycle: isAnnual && !tier.isPerService ? "annual" : "monthly",
      })
    }
  }

  function handleCalculatorSelect(planId: string, amount: number, services: number) {
    navigate("checkout", {
      plan: planId,
      amount: String(amount),
      services: String(services),
      cycle: isAnnual ? "annual" : "monthly",
    })
  }

  return (
    <section
      id="plans"
      className="relative overflow-hidden bg-[#0F172A] py-20 sm:py-28 lg:py-32"
    >
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-full -translate-x-1/2 opacity-20 blur-[140px] bg-[#3B82F6]/25" />
      <div className="pointer-events-none absolute bottom-0 right-10 size-96 rounded-full opacity-15 blur-[120px] bg-[#06B6D4]/20" />
      <div className="pointer-events-none absolute top-1/3 left-0 size-80 rounded-full opacity-10 blur-[120px] bg-[#3B82F6]/20" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#60A5FA] shadow-sm shadow-[#3B82F6]/20">
            <ShieldCheck className="size-3.5 text-[#3B82F6]" />
            Transparent membership &amp; pricing
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Predictable Care Plans with{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#06B6D4] bg-clip-text text-transparent">
              $10 Standard Pricing
            </span>
          </h2>

          <p className="mt-4 text-base text-[#94A3B8] sm:text-lg text-balance">
            Choose between flexible pay-as-you-go visits, the 15-service Pro package ($150/mo), or the 30-service daily care Premium package ($300/mo). 80% is held safely in Paymob escrow.
          </p>

          <div className="mt-8 flex flex-col sm:inline-flex sm:flex-row items-center justify-center gap-2.5 sm:gap-3 rounded-2xl border border-white/10 bg-[#1E293B]/90 p-1.5 backdrop-blur-md shadow-lg shadow-black/40 max-w-full">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`cursor-pointer w-full sm:w-auto text-center rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-bold border border-[#60A5FA]/40"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              Monthly Billing
            </button>
            <div className="flex items-center gap-2">
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label="Toggle annual billing"
                className="data-[state=checked]:bg-[#3B82F6]"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex flex-wrap sm:flex-nowrap justify-center w-full sm:w-auto cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-bold border border-[#60A5FA]/40"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                2 Months Free (~17% Off)
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center w-full px-1">
          <div className="flex flex-col sm:inline-flex sm:flex-row items-stretch sm:items-center gap-1.5 rounded-2xl border border-white/10 bg-[#1E293B] p-1.5 backdrop-blur-xl shadow-xl shadow-black/40 w-full sm:w-auto max-w-full">
            <button
              type="button"
              onClick={() => setCalculatorRole("client")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                calculatorRole === "client"
                  ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 border border-[#60A5FA]/40"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <Users className="size-4 shrink-0" />
              <span>Family Care Packages (15 vs 30 / mo)</span>
            </button>
            <button
              type="button"
              onClick={() => setCalculatorRole("helper")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                calculatorRole === "helper"
                  ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/30 border border-emerald-400/40"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <Coins className="size-4 shrink-0" />
              <span>Helper Daily Earnings Slider (1–10 / day)</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          {calculatorRole === "client" ? (
            <PricingCalculator
              isAnnual={isAnnual}
              onSelectPlan={handleCalculatorSelect}
            />
          ) : (
            <div className="mx-auto mt-6 max-w-5xl">
              <DailyServicesCalculator variant="pricing" />
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">
            Curated Care Packages at a Glance
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
            All packages feature vetted companions, same-gender matching, and Paymob 80% escrow security.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/35 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-5 sm:p-8 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_30px_-5px_rgba(245,158,11,0.2)] relative">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-amber-500/10 blur-[90px]" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6 relative">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Clock className="size-3.5" />
                  On-demand instant service
                </span>
                <span className="text-xs text-[#94A3B8]">· Rapid neighborhood dispatch under 5 mins</span>
              </div>
              <h4 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
                Need Care Right Now? <span className="text-amber-400">$25 Instant On-Demand Dispatch</span>
              </h4>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                Dispatched immediately in real-time with zero queue. Features strict 80/20 commission split with $20.00 directly to your responder in secure Paymob escrow and $5.00 platform safety &amp; insurance fee.
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-[#F8FAFC]">
                <div className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span><strong>$20.00</strong> Net helper payout (80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-4 text-blue-400 shrink-0" />
                  <span><strong>$5.00</strong> Platform safety fee (20%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-4 text-amber-400 shrink-0" />
                  <span>Live GPS visit checkpoints</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
              <div className="text-center sm:text-right">
                <div className="text-3xl sm:text-4xl font-black text-white">
                  $25 <span className="text-xs font-normal text-amber-400">/ instant visit</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">Immediate neighborhood dispatch</p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  navigate("create-request")
                  toast.info("Configuring On-Demand Instant Dispatch ($25 rate).")
                }}
                className="h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 text-xs sm:text-sm rounded-xl gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-[0.99] w-full sm:w-auto justify-center"
              >
                <span>Request Instant On-Demand ($25)</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:gap-8 lg:grid-cols-3 lg:items-stretch">
          {tiers.map((tier) => {
            const isHighlighted = tier.isPopular
            const price = isAnnual && !tier.isPerService ? tier.annualPrice : tier.monthlyPrice
            const periodLabel = tier.isPerService
              ? "/ service"
              : isAnnual
              ? "/ year"
              : "/ month"
            const perMonthEquivalent =
              isAnnual && !tier.isPerService && tier.annualPrice > 0
                ? `~$${Math.round(tier.annualPrice / 12)}/mo billed annually`
                : null

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-5 sm:p-9 backdrop-blur-2xl transition-all duration-300 ${
                  isHighlighted
                    ? "border-2 border-[#3B82F6] bg-[#1E293B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_30px_-5px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.12)] lg:-translate-y-2.5"
                    : "glass-card-interactive border border-white/[0.08] bg-[#1E293B]/85 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-[#3B82F6]/30"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md shadow-[#3B82F6]/30 border border-[#60A5FA]/50">
                      <Check className="size-3 stroke-[2.5]" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#F8FAFC] sm:text-2xl">
                        {tier.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-[#06B6D4]">
                        {tier.tagline}
                      </p>
                    </div>

                    {!isHighlighted && tier.badge && (
                      <span className="rounded-full border border-white/10 bg-[#0F172A] px-2.5 py-1 text-[11px] font-medium text-[#F8FAFC]">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs sm:text-sm text-[#94A3B8] leading-relaxed min-h-[44px]">
                    {tier.description}
                  </p>

                  <div className="mt-6 border-y border-white/10 py-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-5xl">
                        ${price}
                      </span>
                      <span className="text-sm font-medium text-[#94A3B8]">
                        {periodLabel}
                      </span>
                    </div>

                    {perMonthEquivalent && (
                      <p className="mt-1.5 text-xs font-medium text-[#06B6D4]">
                        {perMonthEquivalent}
                      </p>
                    )}

                    <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-bold text-[#60A5FA] border border-[#3B82F6]/20">
                      <CalendarCheck className="size-3.5" />
                      <span>{tier.quotaText}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                      Included in this plan:
                    </p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#F8FAFC]">
                          <div
                            className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                              isHighlighted
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {tier.ctaVariant === "primary" ? (
                    <Button
                      size="lg"
                      onClick={() => handleAction(tier)}
                      className="btn-tactile w-full cursor-pointer gap-2 bg-[#3B82F6] hover:bg-[#2563EB] font-bold text-white shadow-lg shadow-[#3B82F6]/30 border border-[#60A5FA]/40"
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleAction(tier)}
                      className="btn-tactile w-full cursor-pointer gap-2 border-[#3B82F6]/30 bg-[#1E293B] text-[#F8FAFC] hover:border-[#3B82F6]/70 hover:bg-[#334155] hover:text-white"
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="size-4 text-[#3B82F6]" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <Building2 className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#F8FAFC]">
                Institutional, Corporate CSR &amp; Multi-Family Programs
              </h4>
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Managing continuous care for 50+ seniors or running a corporate community initiative? Contact our enterprise coordinators for custom volume SLAs, dedicated dispatch desks, and certified tax impact certificates.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const contactEl = document.getElementById("contact")
              if (contactEl) {
                const navbarHeight = 64
                const elementPosition = contactEl.getBoundingClientRect().top
                const offsetPosition = elementPosition + window.pageYOffset - navbarHeight
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              } else {
                toast.info("Contact our Enterprise Desk at enterprise@wanes-care.org")
              }
            }}
            className="shrink-0 border-white/20 hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 text-white cursor-pointer font-semibold text-xs sm:text-sm"
          >
            <HeartHandshake className="size-4 text-[#3B82F6] mr-1.5" />
            Contact Enterprise Team
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.08] bg-[#1E293B]/80 p-6 backdrop-blur-xl sm:grid-cols-4 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F8FAFC]">100% ID Screened</p>
              <p className="text-[11px] text-[#94A3B8]">Egyptian National ID &amp; Police clearance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F8FAFC]">Rapid SOS Protocol</p>
              <p className="text-[11px] text-[#94A3B8]">Live GPS telemetry &amp; instant kin alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F8FAFC]">80% Paymob Escrow</p>
              <p className="text-[11px] text-[#94A3B8]">Funds released only upon visit sign-off</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#06B6D4] border border-[#06B6D4]/20">
              <Headphones className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F8FAFC]">24/7 Dispatch Desk</p>
              <p className="text-[11px] text-[#94A3B8]">Human ops supervisor always monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
