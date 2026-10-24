import * as React from "react"
import {
  Heart,
  ShoppingBag,
  Smartphone,
  Accessibility,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Search,
} from "lucide-react"
import { type RequestCategory } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export type ClientServicesProps = {
  onRequestService: (category: RequestCategory, defaultTitle?: string) => void
}

type ServiceItem = {
  id: RequestCategory
  title: string
  tagline: string
  description: string
  badgeText: string
  badgeColor: string
  priceText: string
  icon: React.ReactNode
  iconBg: string
  features: string[]
  defaultTitle: string
}

const serviceItems: ServiceItem[] = [
  {
    id: "senior_care",
    title: "Senior Companionship & Wellbeing",
    tagline: "Warm, respectful presence and attentive daily support",
    description:
      "Friendly in-home visits, heartfelt conversation, puzzle solving, reading sessions, and gentle reminders to keep your loved ones active, happy, and connected.",
    badgeText: "Most requested",
    badgeColor: "bg-[#3B82F6]/15 text-[#06B6D4] border-[#06B6D4]/30",
    priceText: "Free 1st visit · Then $15/hr",
    icon: <Heart className="size-6 text-[#3B82F6]" />,
    iconBg: "bg-[#3B82F6]/10 border-[#06B6D4]/20",
    features: [
      "Engaging conversation & emotional companionship",
      "Medication schedule & hydration reminders",
      "Tea & light snack accompaniment",
      "Private family status updates & photos",
    ],
    defaultTitle: "Senior Companionship & Home Visit",
  },
  {
    id: "daily_errands",
    title: "Daily Errands & Grocery Runs",
    tagline: "Reliable neighborhood help for groceries and pickups",
    description:
      "Handled by vetted local helpers: supermarket grocery lists, prescription pickups from your neighborhood pharmacy, post office drop-offs, and heavy deliveries.",
    badgeText: "Same-day dispatch",
    badgeColor: "bg-[#059669]/15 text-[#34D399] border-[#059669]/30",
    priceText: "Community rate · $12 - $18 / trip",
    icon: <ShoppingBag className="size-6 text-[#059669]" />,
    iconBg: "bg-[#059669]/10 border-[#059669]/20",
    features: [
      "Itemized receipt verification & zero-markup costs",
      "Heavy grocery lifting direct into your pantry",
      "Prescription pickups with identity verification",
      "Live GPS status from checkout to your doorstep",
    ],
    defaultTitle: "Grocery & Pharmacy Errand Assistance",
  },
  {
    id: "tech_setup",
    title: "Patient Tech & Digital Setup",
    tagline: "Patient, step-by-step tech help with zero jargon",
    description:
      "Patient youth helpers who explain things calmly. Learn to video-call your children, send audio notes, set up new iPads/phones, and stay safe from online scams.",
    badgeText: "Free for seniors",
    badgeColor: "bg-[#3B82F6]/15 text-[#06B6D4] border-[#06B6D4]/30",
    priceText: "Free community service",
    icon: <Smartphone className="size-6 text-[#3B82F6]" />,
    iconBg: "bg-[#3B82F6]/10 border-[#06B6D4]/20",
    features: [
      "FaceTime, WhatsApp, and Zoom video call setup",
      "Senior font size, high-contrast, & speech settings",
      "Smart TV, remote control, and Wi-Fi pairing",
      "Digital safety check to avoid scam calls & fraud",
    ],
    defaultTitle: "Smartphone & Digital Tech Guidance",
  },
  {
    id: "mobility_assistance",
    title: "Safe Mobility & Clinic Escort",
    tagline: "Gentle arm support and transportation accompaniment",
    description:
      "Gentle, respectful escort for hospital appointments, diagnostic clinics, community prayer, park walks, and social outings with full wheelchair coordination.",
    badgeText: "Door-to-door escort",
    badgeColor: "bg-[#3B82F6]/15 text-[#06B6D4] border-[#06B6D4]/30",
    priceText: "Safe accompaniment · $16/hr",
    icon: <Accessibility className="size-6 text-[#06B6D4]" />,
    iconBg: "bg-[#3B82F6]/10 border-[#06B6D4]/20",
    features: [
      "Arm-in-arm walking & steady balance support",
      "Wheelchair assistance & obstacle navigation",
      "Waiting room presence through doctor visits",
      "Written summaries of doctor instructions for family",
    ],
    defaultTitle: "Mobility Escort & Doctor Appointment",
  },
  {
    id: "emergency_sos",
    title: "Urgent & Rapid SOS Response",
    tagline: "Immediate response for time-sensitive family needs",
    description:
      "When unexpected situations arise—urgent medication needs, sudden distress, or an immediate welfare check—our network triggers immediate priority dispatch.",
    badgeText: "Priority dispatch",
    badgeColor: "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40",
    priceText: "Immediate priority",
    icon: <AlertCircle className="size-6 text-[#EF4444]" />,
    iconBg: "bg-[#EF4444]/10 border-[#EF4444]/20",
    features: [
      "Instant push notification to nearest vetted helpers",
      "Live GPS coordinates linked directly to dispatch desk",
      "Automatic SMS notification to emergency family contacts",
      "Direct backup hotline connection: +20 2 3345 9263",
    ],
    defaultTitle: "Urgent Assistance & Welfare Check",
  },
]

export function ClientServicesSection({ onRequestService }: ClientServicesProps) {
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | RequestCategory>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredServices = React.useMemo(() => {
    return serviceItems.filter((item) => {
      const matchesCategory = selectedFilter === "all" || item.id === selectedFilter
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [selectedFilter, searchQuery])

  return (
    <section id="services" className="relative scroll-mt-24 overflow-hidden bg-[#0F172A] py-16 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-full max-w-7xl -translate-x-1/2 opacity-5 blur-[140px] bg-[#3B82F6]/10" />
      <div className="pointer-events-none absolute -bottom-40 right-10 -z-10 size-96 opacity-4 blur-[130px] bg-[#06B6D4]/10" />

      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#3B82F6]/10 px-3.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#06B6D4] shadow-sm shadow-[#3B82F6]/10">
            <HeartHandshake className="size-3.5 text-[#06B6D4]" />
            <span>Everyday care &amp; companionship</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
            Compassionate Support, Tailored to You
          </h2>

          <p className="text-sm sm:text-lg text-[#94A3B8] leading-relaxed text-balance">
            Select any category below to request immediate assistance. Each visit is fulfilled by an identity-screened companion with live GPS tracking and 24/7 safety oversight.
          </p>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-[#3B82F6] text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/15 font-bold border border-[#06B6D4]/30"
                  : "border border-[#06B6D4]/15 bg-[#1E293B] text-[#94A3B8] hover:border-[#06B6D4]/30 hover:text-[#F8FAFC]"
              }`}
            >
              All Services ({serviceItems.length})
            </button>
            {serviceItems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedFilter(s.id)}
                className={`rounded-full px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === s.id
                    ? "bg-[#3B82F6] text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/15 font-bold border border-[#06B6D4]/30"
                    : "border border-[#06B6D4]/15 bg-[#1E293B] text-[#94A3B8] hover:border-[#06B6D4]/30 hover:text-[#F8FAFC]"
                }`}
              >
                {s.title.split("&")[0].trim()}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#06B6D4]/20 bg-[#1E293B] pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
            />
          </div>
        </div>

        <div className="mt-8 sm:mt-12 grid gap-5 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service, index) => {
            const isFeatured = selectedFilter === "all" && index === 0
            return (
              <div
                key={service.id}
                className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#06B6D4]/15 bg-[#1E293B] p-5 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#06B6D4]/40 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] ${
                  isFeatured ? "md:col-span-2 lg:col-span-2 border-[#3B82F6]/40 bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A]" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex size-12 items-center justify-center rounded-2xl border ${service.iconBg} transition-colors duration-200 group-hover:border-[#06B6D4]/40`}>
                      {service.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${service.badgeColor}`}>
                        {service.badgeText}
                      </span>
                      <span className="text-xs font-semibold text-[#94A3B8]">
                        {service.priceText}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#06B6D4]">
                      {service.tagline}
                    </p>
                  </div>

                  <p className="mt-3.5 text-sm leading-relaxed text-[#94A3B8]">
                    {service.description}
                  </p>

                  <div className="mt-6 space-y-2 border-t border-white/[0.08] pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      What's included:
                    </p>
                    <ul className={`space-y-2 ${isFeatured ? "sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:space-y-0" : ""}`}>
                      {service.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#F8FAFC]">
                          <CheckCircle2 className="size-3.5 shrink-0 text-[#059669] mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-white/[0.08]">
                  <Button
                    onClick={() => onRequestService(service.id, service.defaultTitle)}
                    className="btn-tactile w-full cursor-pointer justify-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] font-bold text-white shadow-sm shadow-[#3B82F6]/15 transition-all rounded-xl py-2.5 border border-[#06B6D4]/30"
                  >
                    <span>Request This Service</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 sm:mt-14 rounded-2xl sm:rounded-3xl border border-[#06B6D4]/15 bg-[#1E293B] p-5 sm:p-10 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                <ShieldCheck className="size-4 text-[#3B82F6]" />
                <span>Specialized Family Care</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                Have a unique request or custom family schedule?
              </h3>
              <p className="text-sm text-[#94A3B8] max-w-xl leading-relaxed">
                Post tailored instructions, select flexible hours, and choose companion preferences such as language, gender, and specialized visit routines.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => onRequestService("daily_errands", "Custom Family Care Request")}
              className="cursor-pointer w-full sm:w-auto shrink-0 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-3 rounded-xl shadow-sm shadow-[#3B82F6]/15 border border-[#06B6D4]/30 transition-all active:scale-[0.98] justify-center"
            >
              <span>Post Custom Request</span>
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
