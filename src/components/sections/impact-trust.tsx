import {
  ShieldCheck,
  BadgeCheck,
  HandHeart,
  Star,
  Clock,
  Lock,
} from "lucide-react"

export function ImpactTrust() {

  const statCards = [
    {
      label: "Platform Safety Standard",
      value: "100%",
      icon: <ShieldCheck className="size-6" />,
      color: "text-blue-400",
    },
    {
      label: "Emergency Dispatch Target",
      value: "< 5m",
      icon: <Clock className="size-6" />,
      color: "text-emerald-400",
    },
    {
      label: "Direct Helper Payout Split",
      value: "80%",
      icon: <HandHeart className="size-6" />,
      color: "text-blue-400",
    },
    {
      label: "Quality & Escrow Rating",
      value: "5.0/5",
      icon: <Star className="size-6" />,
      color: "text-blue-400",
    },
  ]

  const trustPillars = [
    {
      icon: <BadgeCheck className="size-6 text-emerald-400" />,
      title: "Government ID & Safety Screening",
      description:
        "Every companion undergoes Egyptian national ID verification, phone verification, and credential inspection before taking client visits.",
    },
    {
      icon: <ShieldCheck className="size-6 text-[#06B6D4]" />,
      title: "Real-Time GPS Checkpoints",
      description:
        "Active visits include live checkpoint logging and instant family telemetry alerts so loved ones remain updated throughout every step.",
    },
    {
      icon: <Lock className="size-6 text-emerald-400" />,
      title: "Protected Escrow Guarantee",
      description:
        "Payments remain secured in Paymob escrow until the family or senior inspects and confirms visit completion with total satisfaction.",
    },
  ]

  return (
    <section id="impact" className="relative overflow-hidden bg-[#0F172A] py-28 sm:py-36 lg:py-40">
      <div className="pointer-events-none absolute -top-32 right-1/4 size-96 rounded-full bg-blue-500/5 blur-[140px]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 sm:mb-20 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#06B6D4] shadow-sm shadow-[#3B82F6]/10">
            <span>Verified Care Standards</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Built on Safety, Driven by Dignity
          </h2>
          <p className="text-base text-[#94A3B8] sm:text-lg leading-relaxed text-balance">
            Every visit is identity-verified, GPS-monitored, and confirmed by the family—creating a gentle, dependable care network you can always trust.
          </p>
        </div>

        <div className="mb-18 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="glass-card-interactive rounded-3xl border border-[#06B6D4]/15 bg-[#1E293B] p-7 text-center backdrop-blur-2xl shadow-[0_20px_45px_-15px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            >
              <div className="mx-auto mb-3.5 flex size-13 items-center justify-center rounded-2xl bg-[#3B82F6]/10 border border-[#06B6D4]/20 text-[#06B6D4] group-hover:scale-105 transition-transform">
                {stat.icon}
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">{stat.value}</p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[#94A3B8]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {trustPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-[#06B6D4]/15 bg-[#1E293B] p-8 backdrop-blur-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-3"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#3B82F6]/10 border border-[#06B6D4]/20">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">{pillar.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
