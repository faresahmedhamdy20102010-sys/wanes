import * as React from "react"
import {
  Calculator,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Heart,
  DollarSign,
  Percent,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/lib/router"

export type PricingCalculatorProps = {
  isAnnual?: boolean
  onSelectPlan?: (planId: string, amount: number, services: number) => void
}

export function PricingCalculator({
  isAnnual = false,
  onSelectPlan,
}: PricingCalculatorProps) {
  const { navigate } = useRouter()
  const [serviceVolume, setServiceVolume] = React.useState<number>(15)

  const PRICE_PER_SERVICE = 10
  const COMPANION_SHARE_PERCENT = 80
  const COMPANION_RATE = 8.0
  const PLATFORM_FEE = 2.0
  const COMMERCIAL_AGENCY_BENCHMARK = 25

  const monthlyCost = serviceVolume * PRICE_PER_SERVICE
  const effectiveAnnualTotal = monthlyCost * 10
  const effectiveMonthlyCost = isAnnual ? Math.round(effectiveAnnualTotal / 12) : monthlyCost

  const commercialCost = serviceVolume * COMMERCIAL_AGENCY_BENCHMARK
  const monthlySavings = commercialCost - monthlyCost
  const annualSavings = (commercialCost * 12) - (isAnnual ? effectiveAnnualTotal : monthlyCost * 12)

  const companionTotal = (serviceVolume * COMPANION_RATE)
  const platformTotal = (serviceVolume * PLATFORM_FEE)

  const isPro = serviceVolume === 15
  const isPremium = serviceVolume === 30

  const planName = isPremium
    ? "Premium"
    : isPro
    ? "Pro"
    : `Pro + ${serviceVolume - 15} Add-on Services`

  const planId = isPremium ? "premium" : isPro ? "pro" : "custom"

  function handleProceed() {
    const finalAmount = isAnnual ? effectiveAnnualTotal : monthlyCost
    if (onSelectPlan) {
      onSelectPlan(planId, finalAmount, serviceVolume)
    } else {
      navigate("checkout", {
        plan: planId,
        amount: String(finalAmount),
        services: String(serviceVolume),
        cycle: isAnnual ? "annual" : "monthly",
      })
    }
  }

  return (
    <div className="relative mx-auto mt-8 sm:mt-12 w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl border border-[#3B82F6]/25 bg-[#1E293B]/90 p-4 sm:p-9 lg:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_25px_-5px_rgba(59,130,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#3B82F6]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-[#06B6D4]/10 blur-[100px]" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-5 sm:pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3.5 py-1 text-xs font-semibold text-[#60A5FA]">
            <Calculator className="size-3.5 text-[#3B82F6]" />
            Interactive Value &amp; Savings Estimator
          </div>
          <h3 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Customize Your Care Volume
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
            Slide from 15 to 30 services/month to inspect transparent rates, Paymob escrow breakdown, and family savings.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 self-start md:self-auto">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <DollarSign className="size-5" />
          </div>
          <div>
            <div className="text-xs text-emerald-300/80 font-medium">Standard Service Rate</div>
            <div className="text-lg font-black tracking-tight text-emerald-400">
              $10.00 <span className="text-xs font-semibold text-emerald-300/80">/ service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-6 sm:mt-8 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border border-[#3B82F6]/30 bg-[#0F172A]/90 backdrop-blur-xl">
          <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
            <Zap className="size-3.5 text-[#3B82F6] fill-[#3B82F6]" />
            Direct Comparison (15 vs 30 Services):
          </span>
          <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setServiceVolume(15)}
              className={`w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border text-center ${
                serviceVolume === 15
                  ? "bg-[#3B82F6] text-white border-[#60A5FA] shadow-md shadow-[#3B82F6]/30"
                  : "bg-[#1E293B] text-[#94A3B8] border-white/10 hover:text-white"
              }`}
            >
              Pro: 15 Services ($150/mo)
            </button>
            <button
              type="button"
              onClick={() => setServiceVolume(30)}
              className={`w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border text-center ${
                serviceVolume === 30
                  ? "bg-[#3B82F6] text-white border-[#60A5FA] shadow-md shadow-[#3B82F6]/30"
                  : "bg-[#1E293B] text-[#94A3B8] border-white/10 hover:text-white"
              }`}
            >
              Premium: 30 Services ($300/mo)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="service-volume-slider" className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <span>Monthly Services Quota</span>
            <span className="text-xs font-normal normal-case text-[#94A3B8]">(Slide 15 to 30 visits)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8]">Selected:</span>
            <div className="inline-flex items-baseline gap-1 rounded-xl border border-[#3B82F6]/40 bg-[#0F172A] px-3.5 py-1 text-[#3B82F6]">
              <span className="text-2xl font-black text-white">{serviceVolume}</span>
              <span className="text-xs font-bold text-[#60A5FA]">services / mo</span>
            </div>
          </div>
        </div>

        <div className="pt-2 pb-1">
          <Slider
            id="service-volume-slider"
            value={[serviceVolume]}
            min={15}
            max={30}
            step={1}
            onValueChange={(vals) => setServiceVolume(vals[0] || 15)}
            className="w-full cursor-pointer py-4"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { count: 15, label: "15 Services", sub: "Pro Package ($150)", tag: "Pro" },
            { count: 20, label: "20 Services", sub: "Pro + 5 Addons", tag: "Moderate" },
            { count: 25, label: "25 Services", sub: "Extended Family Care", tag: "High Care" },
            { count: 30, label: "30 Services", sub: "Premium Package ($300)", tag: "Daily Care" },
          ].map((preset) => {
            const isSelected = serviceVolume === preset.count
            return (
              <button
                key={preset.count}
                type="button"
                onClick={() => setServiceVolume(preset.count)}
                className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all cursor-pointer border ${
                  isSelected
                    ? "border-[#3B82F6] bg-[#3B82F6]/15 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] ring-1 ring-[#3B82F6]"
                    : "border-white/[0.08] bg-[#0F172A]/70 text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold ${isSelected ? "text-[#60A5FA]" : "text-[#F8FAFC]"}`}>
                    {preset.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-[#3B82F6] text-white" : "bg-white/10 text-white/70"
                  }`}>
                    {preset.tag}
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-0.5">{preset.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#3B82F6]/30 bg-[#0F172A]/80 p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <DollarSign className="size-10 text-[#3B82F6]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Wanes Monthly Cost
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">${effectiveMonthlyCost}</span>
            <span className="text-xs font-semibold text-[#94A3B8]">
              {isAnnual ? "/mo (annual)" : "/month"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#06B6D4] font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>${PRICE_PER_SERVICE} × {serviceVolume} services</span>
          </div>
          {isAnnual && (
            <div className="mt-1 text-[11px] text-emerald-400 font-semibold">
              ${effectiveAnnualTotal}/yr (2 months free!)
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A]/80 p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp className="size-10 text-slate-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Traditional Agency Rate
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-400 line-through decoration-rose-500/70">
              ${commercialCost}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">/month</span>
          </div>
          <div className="mt-2 text-xs text-[#94A3B8]">
            Standard commercial agency fee ($25/visit avg.)
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Sparkles className="size-10 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Direct Family Savings
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-400">
              ${isAnnual ? Math.round(annualSavings / 12) : monthlySavings}
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              /month saved
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-300/90 font-semibold flex items-center gap-1.5">
            <Zap className="size-3.5 fill-emerald-400 stroke-none" />
            <span>Save 60% with Wanes community aid</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#06B6D4]/30 bg-[#06B6D4]/10 p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Heart className="size-10 text-[#06B6D4]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#06B6D4]">
            Companion Direct Payout
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-[#F8FAFC]">${companionTotal.toFixed(2)}</span>
            <span className="text-xs font-semibold text-[#06B6D4]">/month</span>
          </div>
          <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#06B6D4]" />
            <span>80% Paymob escrow guarantee</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0F172A]/90 p-5 backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
            <Percent className="size-4 text-[#3B82F6]" />
            Transparent Earnings &amp; Safety Allocation per $10 Service
          </span>
          <span className="text-[#94A3B8] font-mono">
            {serviceVolume} Services Total = ${monthlyCost}.00
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${COMPANION_SHARE_PERCENT}%` }}
            title={`Companion Share: 80% ($${companionTotal.toFixed(2)})`}
          />
          <div
            className="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] transition-all duration-300"
            style={{ width: `${100 - COMPANION_SHARE_PERCENT}%` }}
            title={`Wanes Trust & Safety: 20% ($${platformTotal.toFixed(2)})`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
            <span className="flex items-center gap-2 text-[#F8FAFC]">
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span>Vetted Companion Payout (80%)</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              ${COMPANION_RATE.toFixed(2)} / visit (${companionTotal.toFixed(2)}/mo)
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
            <span className="flex items-center gap-2 text-[#F8FAFC]">
              <span className="size-2.5 rounded-full bg-[#3B82F6]" />
              <span>Wanes Trust &amp; Safety Telemetry (20%)</span>
            </span>
            <span className="font-mono font-bold text-[#60A5FA]">
              ${PLATFORM_FEE.toFixed(2)} / visit (${platformTotal.toFixed(2)}/mo)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#3B82F6]/40 bg-gradient-to-r from-[#3B82F6]/15 via-[#1E293B] to-[#06B6D4]/15 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#3B82F6] text-white hover:bg-[#3B82F6] text-xs font-bold uppercase tracking-wider">
              {isPro ? "Pro Plan" : isPremium ? "Premium Plan" : "Custom Volume Plan"}
            </Badge>
            {isPremium && (
              <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold">
                Daily Care Coverage
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#F8FAFC]">
            {isPro
              ? "Covers 15 visits/month at $150 ($10/service base) with full SOS safety protocol & live GPS tracking."
              : isPremium
              ? "Covers 30 visits/month at $300 ($10/service base) with daily companion presence & primary helper allocation."
              : `Covers ${serviceVolume} visits/month ($150 Pro base + ${serviceVolume - 15} add-ons at $10/service).`}
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleProceed}
          className="btn-tactile shrink-0 cursor-pointer gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-[#3B82F6]/25 border border-[#60A5FA]/40 px-6 py-6 text-sm"
        >
          <span>Choose {planName} (${effectiveMonthlyCost}/mo)</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
