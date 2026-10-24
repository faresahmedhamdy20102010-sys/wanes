import * as React from "react"
import {
  Calculator,
  TrendingUp,
  CheckCircle2,
  Coins,
  ArrowRight,
  Wallet,
  Zap,
  Sparkles,
  Calendar,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/lib/router"

export type DailyServicesCalculatorProps = {
  variant?: "dashboard" | "pricing"
  onActionClick?: () => void
  className?: string
}

export function DailyServicesCalculator({
  variant = "dashboard",
  onActionClick,
  className = "",
}: DailyServicesCalculatorProps) {
  const { navigate } = useRouter()

  const [dailyServices, setDailyServices] = React.useState<number>(4)

  const [daysPerMonth, setDaysPerMonth] = React.useState<number>(30)

  const [currency, setCurrency] = React.useState<"USD" | "EGP">("USD")
  const EGP_EXCHANGE_RATE = 50

  const SERVICE_PRICE_USD = 10
  const HELPER_SPLIT_PERCENT = 80
  const PLATFORM_FEE_PERCENT = 20

  const HELPER_RATE_USD = 8.0
  const PLATFORM_RATE_USD = 2.0

  const totalMonthlyServices = dailyServices * daysPerMonth

  const dailyGrossUSD = dailyServices * SERVICE_PRICE_USD
  const dailyHelperUSD = dailyServices * HELPER_RATE_USD

  const monthlyGrossUSD = totalMonthlyServices * SERVICE_PRICE_USD
  const monthlyHelperUSD = totalMonthlyServices * HELPER_RATE_USD
  const monthlyPlatformUSD = totalMonthlyServices * PLATFORM_RATE_USD

  const annualHelperUSD = monthlyHelperUSD * 12

  const toDisplay = (usdAmount: number) => {
    if (currency === "EGP") {
      const egp = Math.round(usdAmount * EGP_EXCHANGE_RATE)
      return `${egp.toLocaleString()} EGP`
    }
    return `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const toDisplayDetailed = (usdAmount: number) => {
    if (currency === "EGP") {
      const egp = Math.round(usdAmount * EGP_EXCHANGE_RATE)
      return `${egp.toLocaleString()} EGP`
    }
    return `$${usdAmount.toFixed(2)}`
  }

  const presets = [
    { count: 1, label: "Casual", desc: "1 / day" },
    { count: 3, label: "Part-Time", desc: "3 / day" },
    { count: 5, label: "Dedicated", desc: "5 / day" },
    { count: 8, label: "Full-Time", desc: "8 / day" },
    { count: 10, label: "Max Volume", desc: "10 / day" },
  ]

  const getHelperBadge = (services: number) => {
    if (services <= 2) return { text: "Casual Earner", color: "border-sky-500/30 bg-sky-500/10 text-sky-400" }
    if (services <= 4) return { text: "Active Companion", color: "border-blue-500/30 bg-blue-500/10 text-blue-400" }
    if (services <= 7) return { text: "High-Volume Caregiver", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" }
    return { text: "Top-Tier Super Helper", color: "border-amber-500/30 bg-amber-500/10 text-amber-400" }
  }

  const badgeInfo = getHelperBadge(dailyServices)

  function handleMainAction() {
    if (onActionClick) {
      onActionClick()
      return
    }
    if (variant === "dashboard") {
      const el = document.getElementById("available-tasks-feed")
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      navigate("signup")
    }
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-[#3B82F6]/30 bg-[#1E293B] p-6 sm:p-8 lg:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_25px_-5px_rgba(59,130,246,0.18),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all ${className}`}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#3B82F6]/10 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-[#059669]/10 blur-[110px]" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3.5 py-1 text-xs font-semibold text-[#60A5FA]">
            <Calculator className="size-3.5 text-[#3B82F6]" />
            Helper Daily Services &amp; Earnings Calculator
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Project Your Monthly Payout
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
            Slide your estimated daily visits (1–10) to visualize instant real-time earnings with our guaranteed 80% helper payout split.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400">
            <Coins className="size-4 text-emerald-400" />
            <span>80% Helper / 20% Fee</span>
          </div>

          <div className="inline-flex items-center rounded-xl border border-white/[0.08] bg-[#0F172A] p-1 text-xs">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("EGP")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                currency === "EGP"
                  ? "bg-[#059669] text-white shadow-md shadow-[#059669]/30"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              EGP
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="space-y-6 lg:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0F172A]/70 p-4 backdrop-blur-xl">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
                Estimated Completed Services
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-[#F8FAFC]">
                  {dailyServices}
                </span>
                <span className="text-sm font-semibold text-[#3B82F6]">
                  {dailyServices === 1 ? "service / day" : "services / day"}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  ({totalMonthlyServices} / month)
                </span>
              </div>
            </div>

            <Badge className={`${badgeInfo.color} font-bold text-xs px-3 py-1.5 self-start sm:self-auto`}>
              <Sparkles className="size-3 mr-1.5" />
              {badgeInfo.text}
            </Badge>
          </div>

          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="font-semibold">1 Service/day (Casual)</span>
              <span className="font-semibold">5 Services/day</span>
              <span className="font-semibold">10 Services/day (Max)</span>
            </div>

            <Slider
              value={[dailyServices]}
              min={1}
              max={10}
              step={1}
              onValueChange={(val) => {
                if (val && val[0]) setDailyServices(val[0])
              }}
              className="py-3 cursor-pointer"
            />

            <div className="flex justify-between px-1 text-[11px] font-bold text-[#94A3B8]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDailyServices(num)}
                  className={`size-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    dailyServices === num
                      ? "bg-[#3B82F6] text-white font-extrabold shadow-md shadow-[#3B82F6]/30 scale-110"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
              Quick Volume Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {presets.map((p) => {
                const isSelected = dailyServices === p.count
                return (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => setDailyServices(p.count)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#F8FAFC] shadow-lg shadow-[#3B82F6]/20 ring-1 ring-[#3B82F6]"
                        : "border-white/[0.08] bg-[#0F172A]/50 text-[#94A3B8] hover:border-[#3B82F6]/40 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#F8FAFC]">{p.label}</span>
                    <span className="text-[10px] text-[#3B82F6]">{p.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0F172A]/50 px-4 py-2.5 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#3B82F6]" />
              <span>Working Days / Month:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[20, 26, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysPerMonth(days)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    daysPerMonth === days
                      ? "bg-[#3B82F6]/25 text-[#60A5FA] border border-[#3B82F6]/50"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {days}d {days === 20 ? "(P/T)" : days === 30 ? "(Full)" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0F172A] to-[#1E293B] p-6 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#059669] via-[#10B981] to-[#3B82F6]" />

            <div className="text-center pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-400" />
                Projected Monthly Net Payout (80%)
              </span>
              <div className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                <span>{toDisplay(monthlyHelperUSD)}</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-400 self-end mb-1">
                  / month
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1.5">
                Based on {totalMonthlyServices} services @ {toDisplayDetailed(HELPER_RATE_USD)} helper take-home per visit
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-white/[0.08] bg-[#0F172A]/70 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Helper Payout ({HELPER_SPLIT_PERCENT}%)</span>
                </div>
                <span className="font-bold text-white">
                  {toDisplay(monthlyHelperUSD)}
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-300"
                  style={{ width: `${HELPER_SPLIT_PERCENT}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: `${PLATFORM_FEE_PERCENT}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-0.5">
                <span>Platform commission ({PLATFORM_FEE_PERCENT}%): {toDisplay(monthlyPlatformUSD)}</span>
                <span>Gross: {toDisplay(monthlyGrossUSD)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/[0.08] bg-[#0F172A]/60 p-3">
                <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block">
                  Daily Net Take-Home
                </span>
                <span className="text-base font-extrabold text-[#F8FAFC] block mt-0.5">
                  {toDisplay(dailyHelperUSD)}
                  <span className="text-[10px] font-normal text-[#94A3B8]"> / day</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                  {dailyServices} visits @ {toDisplay(HELPER_RATE_USD)} (Gross: {toDisplay(dailyGrossUSD)})
                </span>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#0F172A]/60 p-3">
                <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block">
                  Annualized Potential
                </span>
                <span className="text-base font-extrabold text-[#F8FAFC] block mt-0.5">
                  {toDisplay(annualHelperUSD)}
                  <span className="text-[10px] font-normal text-[#94A3B8]"> / yr</span>
                </span>
                <span className="text-[10px] text-blue-400 font-semibold block mt-0.5">
                  12-month projection
                </span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-white/[0.08] pt-3 text-[11px] text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Paymob Escrow safety locks your 80% payout before visit start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Instant withdrawal to Mobile Wallets (Vodafone Cash, etc.) or Meeza</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>20% fee covers background vetting, insurance, and 24/7 SOS dispatch</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleMainAction}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold h-11 text-xs sm:text-sm rounded-xl gap-2 shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-all hover:scale-[1.01]"
            >
              {variant === "dashboard" ? (
                <>
                  <Zap className="size-4 text-amber-300" />
                  View &amp; Accept Available Tasks
                </>
              ) : (
                <>
                  <Wallet className="size-4 text-emerald-300" />
                  Start Earning as a Verified Companion
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
