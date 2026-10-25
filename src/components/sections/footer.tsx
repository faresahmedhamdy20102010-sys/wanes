import * as React from "react"
import {
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import { useRouter } from "@/lib/router"
import { useAuth } from "@/lib/auth-context"

export function Footer() {
  const { navigate, route } = useRouter()
  const { user, profile } = useAuth()
  const isClient = !!user && (profile?.role === "standard_requester" || profile?.role === "senior_requester" || !profile?.role)

  function handleAnchorClick(targetId: string, e: React.MouseEvent) {
    e.preventDefault()
    const scrollToTarget = () => {
      const el = document.getElementById(targetId)
      if (el) {
        const navbarHeight = 64
        const elementPosition = el.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    }

    if (route === "home") {
      scrollToTarget()
    } else {
      navigate("home")
      setTimeout(scrollToTarget, 100)
    }
  }

  return (
    <footer className="relative overflow-hidden bg-[#0F172A] border-t border-white/[0.08] text-[#94A3B8] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-12">
      <div className="pointer-events-none absolute -bottom-24 left-1/4 size-96 rounded-full bg-[#3B82F6]/2 blur-[140px]" />
      <div className="pointer-events-none absolute -top-24 right-1/4 size-96 rounded-full bg-[#06B6D4]/2 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 pb-12 sm:pb-16 border-b border-white/[0.08]">
          <div className="space-y-5 lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20">
                <HeartHandshake className="size-6 stroke-[2.3]" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-[#F8FAFC]">Wanes</span>
                <p className="text-[11px] font-semibold text-[#06B6D4] uppercase tracking-wider">
                  Community Assistance Platform
                </p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-[#94A3B8]">
              Building stronger communities, one connection at a time. Empowering elderly care, verified neighborly aid, and continuous safety telemetry.
            </p>

            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#1E293B]/60 px-3.5 py-1.5 text-xs text-[#94A3B8]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#059669] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#059669]" />
              </span>
              <span className="font-medium text-[#F8FAFC]">24/7 Sentinel Dispatch Desk Online</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("safety")}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-1.5 text-xs font-semibold text-[#EF4444] transition-colors hover:bg-[#EF4444]/20"
              >
                <ShieldAlert className="size-3.5" />
                <span>Emergency SOS</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("safety")}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B]/60 px-3.5 py-1.5 text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#06B6D4]/30 hover:text-[#F8FAFC]"
              >
                <ShieldCheck className="size-3.5 text-[#06B6D4]" />
                <span>Safety Architecture</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Navigation & Exploration
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleAnchorClick("services", e)}
                  className="flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
                >
                  <ArrowRight className="size-3.5 text-[#06B6D4]" />
                  <span>Care Services Catalog</span>
                </a>
              </li>
              <li>
                <a
                  href="#journey"
                  onClick={(e) => handleAnchorClick("journey", e)}
                  className="flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
                >
                  <ArrowRight className="size-3.5 text-[#06B6D4]" />
                  <span>How It Works</span>
                </a>
              </li>
              <li>
                <a
                  href="#sos"
                  onClick={(e) => handleAnchorClick("sos", e)}
                  className="flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
                >
                  <ArrowRight className="size-3.5 text-[#06B6D4]" />
                  <span>SOS Safety & Telemetry</span>
                </a>
              </li>
              <li>
                <a
                  href="#plans"
                  onClick={(e) => handleAnchorClick("plans", e)}
                  className="flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
                >
                  <ArrowRight className="size-3.5 text-[#06B6D4]" />
                  <span>Care Plans & Pricing</span>
                </a>
              </li>
              <li>
                <a
                  href="#impact"
                  onClick={(e) => handleAnchorClick("impact", e)}
                  className="flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
                >
                  <ArrowRight className="size-3.5 text-[#06B6D4]" />
                  <span>Community Impact & Trust</span>
                </a>
              </li>
              <li>
                {isClient ? (
                  <button
                    type="button"
                    onClick={() => navigate("dashboard")}
                    className="cursor-pointer flex items-center gap-2 text-[#3B82F6] font-semibold transition-colors hover:text-[#06B6D4]"
                  >
                    <ArrowRight className="size-3.5 text-[#06B6D4]" />
                    <span>My Care Dashboard &amp; Requests</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("volunteer")}
                    className="cursor-pointer flex items-center gap-2 text-[#3B82F6] font-semibold transition-colors hover:text-[#06B6D4]"
                  >
                    <ArrowRight className="size-3.5 text-[#06B6D4]" />
                    <span>Become a Helper / Provider Portal</span>
                  </button>
                )}
              </li>
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Operations & Emergency Hotline
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#1E293B]/70 p-3.5 backdrop-blur-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
                  <Phone className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8]">Emergency & Dispatch Hotline</p>
                  <p className="text-sm font-bold text-[#F8FAFC] tracking-wide">
                    +1 (800) 555-WANES <span className="text-xs font-normal text-[#EF4444]">(9263)</span>
                  </p>
                  <p className="text-[11px] text-[#94A3B8]/70">Toll-free 24/7 Rapid Response</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#1E293B]/70 p-3.5 backdrop-blur-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Mail className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8]">Support & Inquiries</p>
                  <a
                    href="mailto:support@wanes-care.org"
                    className="text-sm font-bold text-[#F8FAFC] hover:text-[#06B6D4] transition-colors"
                  >
                    support@wanes-care.org
                  </a>
                  <p className="text-[11px] text-[#94A3B8]/70">Average reply within 15 minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#1E293B]/70 p-3.5 backdrop-blur-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                  <MapPin className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8]">24/7 Operations Dispatch HQ</p>
                  <p className="text-xs font-semibold text-[#F8FAFC]">
                    Wanes Dispatch Center, Suite 400 · Innovation Way
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-[#94A3B8] sm:flex-row">
          <p>
            Copyright &copy; 2026 Wanes Community Assistance Platform. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => navigate("safety")}
              className="cursor-pointer hover:text-[#06B6D4] transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-white/10">|</span>
            <button
              type="button"
              onClick={() => navigate("safety")}
              className="cursor-pointer hover:text-[#06B6D4] transition-colors"
            >
              Terms of Service
            </button>
            <span className="text-white/10">|</span>
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              className="cursor-pointer hover:text-[#06B6D4] transition-colors"
            >
              System Telemetry
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
