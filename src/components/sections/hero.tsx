import * as React from "react"
import {
  HandHeart,
  Users,
  ShieldCheck,
  Play,
  ArrowRight,
  Heart,
  ShoppingBag,
  Smartphone,
  Accessibility,
  AlertCircle,
  Mic,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { useRouter } from "@/lib/router"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { type RequestCategory } from "@/lib/supabase"

type HeroProps = {
  onOpenVideoModal: () => void
  onRequestCare?: (category?: RequestCategory, defaultTitle?: string) => void
  onOpenVoiceAssistant?: () => void
}

type QuickCategory = {
  id: RequestCategory
  label: string
  icon: React.ReactNode
  defaultTitle: string
}

const quickCategories: QuickCategory[] = [
  { id: "senior_care", label: "Senior Care", icon: <Heart className="size-3.5" />, defaultTitle: "Senior Companionship & Check-in" },
  { id: "daily_errands", label: "Daily Errands", icon: <ShoppingBag className="size-3.5" />, defaultTitle: "Grocery & Pharmacy Errand Run" },
  { id: "tech_setup", label: "Tech Help", icon: <Smartphone className="size-3.5" />, defaultTitle: "Smartphone & iPad Setup" },
  { id: "mobility_assistance", label: "Clinic Escort", icon: <Accessibility className="size-3.5" />, defaultTitle: "Doctor Appointment & Walking Escort" },
  { id: "emergency_sos", label: "Urgent SOS", icon: <AlertCircle className="size-3.5" />, defaultTitle: "Urgent Welfare Check" },
]

export function Hero({ onOpenVideoModal, onRequestCare, onOpenVoiceAssistant }: HeroProps) {
  const { navigate } = useRouter()
  const { user, profile } = useAuth()
  const isClient = !!user && (profile?.role === "standard_requester" || profile?.role === "senior_requester" || !profile?.role)
  const tiltRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const [selectedCategory, setSelectedCategory] = React.useState<RequestCategory>("senior_care")
  const [quickNotes, setQuickNotes] = React.useState("")

  React.useEffect(() => {
    const video = videoRef.current
    if (video && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      video.defaultMuted = true
      video.muted = true
      video.setAttribute("playsinline", "true")
      video.setAttribute("webkit-playsinline", "true")
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    }

    return () => {
      if (video) {
        video.pause()
      }
    }
  }, [])

  React.useEffect(() => {
    const card = tiltRef.current
    if (!card) return

    let rafId: number | null = null
    let targetRotateX = 0
    let targetRotateY = 0

    function updateTransform() {
      if (card) {
        card.style.transform = `perspective(1000px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg)`
      }
      rafId = null
    }

    function handleMouseMove(e: MouseEvent) {
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      targetRotateX = ((y - centerY) / centerY) * -6
      targetRotateY = ((x - centerX) / centerX) * 6

      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform)
      }
    }

    function handleMouseLeave() {
      if (!card) return
      targetRotateX = 0
      targetRotateY = 0
      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform)
      }
    }

    card.addEventListener("mousemove", handleMouseMove, { passive: true })
    card.addEventListener("mouseleave", handleMouseLeave, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  function handleStartRequest() {
    const cat = quickCategories.find((c) => c.id === selectedCategory)
    const title = quickNotes.trim() || cat?.defaultTitle || "Care Assistance Request"
    if (onRequestCare) {
      onRequestCare(selectedCategory, title)
    } else {
      navigate("create-request", { category: selectedCategory, title })
    }
  }

  function handleScrollToServices() {
    const el = document.getElementById("services")
    if (el) {
      const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - 70
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  return (
    <section id="hero" className="relative flex min-h-svh w-full max-w-full items-center overflow-hidden pt-28 pb-20 sm:pt-40 sm:pb-32 lg:pt-44 lg:pb-36 bg-[#0F172A]">
      <div className="absolute inset-0 z-0 w-full h-full max-w-full overflow-hidden pointer-events-none bg-[#0F172A]">
        {/* Desktop Background Video: visible on md and larger screens */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-95 transition-opacity duration-700 select-none"
          aria-hidden="true"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Mobile Static Backdrop: visible on screens smaller than md */}
        <div className="block md:hidden absolute inset-0 w-full h-full bg-gradient-to-b from-[#0B1329] via-[#0F172A] to-[#0A0F1D] pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 size-80 rounded-full bg-[#3B82F6]/15 blur-[100px]" />
          <div className="absolute top-1/3 -right-20 size-72 rounded-full bg-[#06B6D4]/12 blur-[90px]" />
          <div className="absolute -bottom-20 left-1/4 size-72 rounded-full bg-[#3B82F6]/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/28 via-[#0F172A]/20 to-[#0F172A]/32 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="flex flex-col gap-6 sm:gap-8 lg:col-span-7">
            <div className="inline-flex w-fit max-w-full items-center gap-1.5 sm:gap-2 rounded-full border border-[#06B6D4]/40 bg-[#0F172A]/85 backdrop-blur-md px-3.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-[#06B6D4] shadow-lg shadow-black/40">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#06B6D4] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#3B82F6]" />
              </span>
              <span className="truncate">Verified neighborhood care network · Free first visit</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl text-balance leading-[1.15] sm:leading-[1.12] drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
              Compassionate Care &amp; Daily Help,{" "}
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#60A5FA] bg-clip-text text-transparent">
                Requested in Seconds.
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-[#F1F5F9] text-balance leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] font-medium">
              Find verified, background-checked local companions for senior care, daily grocery errands,
              device tech setup, and clinic escorts. Monitored with live GPS safety and 24/7 emergency dispatch.
            </p>

            <div className="glass-card-elevated relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 border border-[#06B6D4]/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-[#1E293B]/95 backdrop-blur-2xl">
              <div className="pointer-events-none absolute -top-12 left-1/4 h-24 w-1/2 rounded-full bg-[#3B82F6]/3 blur-2xl" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-3.5 sm:pb-4 border-b border-white/[0.08] relative">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#06B6D4]">
                  Step 1: Choose needed assistance
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-[#94A3B8] flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
                  Average match under 15 mins
                </span>
              </div>

              <div className="mt-3.5 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 relative">
                {quickCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`btn-tactile flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-[#3B82F6] text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/15 font-bold border border-[#06B6D4]/40"
                        : "border border-[#06B6D4]/15 bg-[#1E293B] text-[#94A3B8] hover:border-[#06B6D4]/40 hover:text-[#F8FAFC]"
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row relative">
                <input
                  type="text"
                  placeholder="Describe your request (e.g. Grocery run, doctor walk)..."
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleStartRequest()
                  }}
                  className="w-full flex-1 rounded-xl border border-[#06B6D4]/20 bg-[#0F172A] px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 transition-all shadow-inner"
                />

                <Button
                  size="lg"
                  onClick={handleStartRequest}
                  className="btn-tactile cursor-pointer gap-2 bg-[#3B82F6] hover:bg-[#2563EB] font-bold text-white shadow-sm shadow-[#3B82F6]/15 rounded-xl border border-[#06B6D4]/30 w-full sm:w-auto justify-center"
                >
                  <span>Request Now</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/[0.08] text-xs text-[#94A3B8]">
                {onOpenVoiceAssistant && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAssistant}
                    className="flex cursor-pointer items-center gap-1.5 text-[#06B6D4] transition-colors hover:text-[#22D3EE] font-medium"
                  >
                    <Mic className="size-3.5 animate-pulse text-[#06B6D4]" />
                    <span>Prefer speaking? Try voice request</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleScrollToServices}
                  className="cursor-pointer text-[#94A3B8] underline hover:text-[#F8FAFC] transition-colors"
                >
                  Explore all 5 care services &amp; pricing →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC] drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                <CheckCircle2 className="size-4 text-[#059669] shrink-0" />
                <span>Free first visit</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC] drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                <CheckCircle2 className="size-4 text-[#3B82F6] shrink-0" />
                <span>ID &amp; background verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC] drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                <CheckCircle2 className="size-4 text-[#EF4444] shrink-0" />
                <span>24/7 family safety alerts</span>
              </div>
            </div>

            {isClient ? (
              <div className="pt-2 flex items-center gap-2 text-xs text-[#06B6D4] border-t border-white/[0.08]">
                <ShieldCheck className="size-3.5 text-[#3B82F6] shrink-0" />
                <span>Client mode active · Care dispatch ready</span>
              </div>
            ) : !user ? (
              <div className="pt-2 text-xs text-[#94A3B8] border-t border-white/[0.08]">
                <span>Looking to offer assistance as a helper? </span>
                <button
                  type="button"
                  onClick={() => navigate("volunteer")}
                  className="cursor-pointer font-bold text-[#3B82F6] underline decoration-[#3B82F6]/50 hover:text-[#06B6D4] hover:decoration-[#06B6D4]"
                >
                  Join as a Service Provider &rarr;
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <div
              ref={tiltRef}
              className="w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 transition-transform duration-200 ease-out will-change-transform border border-[#06B6D4]/25 bg-[#1E293B]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#06B6D4] border border-[#06B6D4]/25">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#F8FAFC]">Live care protection</h3>
                    <p className="text-xs text-[#94A3B8]">Real-time companion dispatch</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-[#059669]/15 px-2.5 py-1 text-[11px] font-bold text-[#059669] border border-[#059669]/30">
                  <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
                  Live
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#06B6D4]/15 bg-[#0F172A] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#059669]/15 text-[#059669] border border-[#059669]/20">
                      <Clock className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8] font-medium">Average response time</p>
                      <p className="text-xs font-semibold text-[#F8FAFC]">Local helpers on standby</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-[#F8FAFC]">&lt; 15 mins</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#06B6D4]/15 bg-[#0F172A] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#06B6D4] border border-[#06B6D4]/20">
                      <Users className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8] font-medium">Verified local helpers</p>
                      <p className="text-xs font-semibold text-[#F8FAFC]">Cairo &amp; Giza neighborhood coverage</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-[#F8FAFC]">450+</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#06B6D4]/15 bg-[#0F172A] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#06B6D4] border border-[#06B6D4]/20">
                      <HandHeart className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8] font-medium">Family satisfaction</p>
                      <p className="text-xs font-semibold text-[#F8FAFC]">3,200+ completed visits</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-[#06B6D4]">4.9 / 5</span>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenVideoModal}
                  className="cursor-pointer gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
                >
                  <Play className="size-3.5 text-[#3B82F6]" />
                  <span>See how Wanes helps families</span>
                </Button>
                <span className="text-[11px] text-[#94A3B8]">2 min video</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
