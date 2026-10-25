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
      label: "ID & background check",
      value: "100%",
      icon: <ShieldCheck className="size-6" />,
      color: "text-blue-400",
    },
    {
      label: "Average response time",
      value: "4.8m",
      icon: <Clock className="size-6" />,
      color: "text-emerald-400",
    },
    {
      label: "Helper payout share",
      value: "80%",
      icon: <HandHeart className="size-6" />,
      color: "text-blue-400",
    },
    {
      label: "Family review rating",
      value: "4.9 / 5",
      icon: <Star className="size-6" />,
      color: "text-blue-400",
    },
  ]

  const trustPillars = [
    {
      icon: <BadgeCheck className="size-6 text-emerald-400" />,
      badge: "Mandatory check",
      title: "National ID & criminal screening",
      description:
        "Every companion undergoes Egyptian national ID verification, mobile number authentication, and personal reference screening before their first visit.",
    },
    {
      icon: <ShieldCheck className="size-6 text-[#06B6D4]" />,
      badge: "Live telemetry",
      title: "Real-time GPS visit checkpoints",
      description:
        "Active visits log arrival, in-home progress, and departure checkpoints so family members stay informed without feeling intrusive.",
    },
    {
      icon: <Lock className="size-6 text-emerald-400" />,
      badge: "Paymob escrow",
      title: "Protected escrow guarantee",
      description:
        "Payment is held safely in escrow until the family or senior confirms the visit was completed with genuine care and satisfaction.",
    },
  ]

  return (
    <section id="impact" className="relative overflow-hidden bg-[#0F172A] py-20 md:py-28 lg:py-36">
      <div className="pointer-events-none absolute -top-32 right-1/4 size-96 rounded-full bg-blue-500/5 blur-[140px]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-16 lg:mb-20 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#06B6D4] shadow-sm shadow-[#3B82F6]/10">
            <span>Verified care standards</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Built on Safety, Driven by Dignity
          </h2>
          <p className="text-base text-[#94A3B8] sm:text-lg leading-relaxed max-w-2xl mx-auto text-balance">
            Every visit is identity-verified, GPS-monitored, and confirmed by the family—creating a gentle, dependable care network you can always trust.
          </p>
        </div>

        <div className="mb-14 sm:mb-20 grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="group rounded-2xl sm:rounded-3xl border border-[#06B6D4]/15 bg-[#1E293B] p-5 sm:p-8 text-center backdrop-blur-2xl shadow-[0_20px_45px_-15px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#06B6D4]/35"
            >
              <div className="mx-auto mb-2.5 sm:mb-3.5 flex size-10 sm:size-13 items-center justify-center rounded-xl sm:rounded-2xl bg-[#3B82F6]/10 border border-[#06B6D4]/20 text-[#06B6D4] transition-colors duration-200 group-hover:border-[#06B6D4]/40 group-hover:bg-[#3B82F6]/20">
                {stat.icon}
              </div>
              <p className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">{stat.value}</p>
              <p className="mt-1 text-[11px] sm:text-sm font-medium text-[#94A3B8]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:gap-8 lg:gap-10 lg:grid-cols-3">
          {trustPillars.map((pillar, idx) => (
            <div
              key={idx}
              className={`group rounded-2xl sm:rounded-3xl border p-6 sm:p-8 lg:p-10 backdrop-blur-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-4 transition-all duration-300 ease-out hover:-translate-y-1 ${
                idx === 0
                  ? "border-[#06B6D4]/30 bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A] hover:border-[#06B6D4]/50"
                  : "border-[#06B6D4]/15 bg-[#1E293B] hover:border-[#06B6D4]/35"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#3B82F6]/10 border border-[#06B6D4]/20 transition-colors duration-200 group-hover:border-[#06B6D4]/40">
                  {pillar.icon}
                </div>
                <span className="text-[11px] font-semibold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-full px-2.5 py-0.5">
                  {pillar.badge}
                </span>
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
