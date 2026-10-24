import * as React from "react"

import {
  HeartHandshake,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Menu,
  X,
  Heart,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { SimpleModeButton } from "@/components/accessibility/simple-mode-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type NavbarProps = {
  onOpenRequestModal?: () => void
  onOpenVoiceAssistant?: () => void
}

const navLinks = [
  { label: "Care Services", target: "services" },
  { label: "How It Works", target: "journey" },
  { label: "Safety & SOS", target: "sos" },
  { label: "Care Plans", target: "plans" },
  { label: "Impact", target: "impact" },
]

export function Navbar({ onOpenRequestModal }: NavbarProps = {}) {
  const { user, profile, signOut } = useAuth()
  const { route, navigate } = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isClient = !!user && (profile?.role === "standard_requester" || profile?.role === "senior_requester" || !profile?.role)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [authModalMode, setAuthModalMode] = React.useState<"signup" | "signin">("signup")
  const [authModalUserType, setAuthModalUserType] = React.useState<"client" | "provider">("client")

  React.useEffect(() => {
    let ticking = false
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled((prev) => {
            const next = window.scrollY > 20
            return prev !== next ? next : prev
          })
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function handleAnchorClick(targetId: string, e: React.MouseEvent) {
    e.preventDefault()
    setMobileMenuOpen(false)

    const scrollToTarget = () => {
      const el = document.getElementById(targetId)
      if (el) {
        const navbarHeight = 68
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
  function handleBrandClick() {
    setMobileMenuOpen(false)
    if (route === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      navigate("home")
    }
  }
  function handleRequestCareClick() {
    setMobileMenuOpen(false)
    if (onOpenRequestModal) {
      onOpenRequestModal()
    } else {
      navigate("create-request")
    }
  }
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0F172A]/85 backdrop-blur-xl border-b border-[#06B6D4]/15 shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent shadow-none"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBrandClick}
          className="flex cursor-pointer items-center gap-2 sm:gap-2.5 transition-all hover:opacity-90 focus:outline-none shrink-0"
          aria-label="Wanes Home"
        >
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] text-white shadow-sm shadow-[#3B82F6]/20">
            <HeartHandshake className="size-4.5 sm:size-5 stroke-[2.3]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F8FAFC] leading-none">Wanes</span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-[#06B6D4] uppercase">Care &amp; Aid</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-md">
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => handleAnchorClick(link.target, e)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#94A3B8] transition-all duration-200 hover:bg-white/[0.08] hover:text-[#F8FAFC] focus:outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:flex">
            <SimpleModeButton variant="navbar" />
          </div>

          {!isClient && !user && (
            <button
              type="button"
              onClick={() => navigate("volunteer")}
              className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#06B6D4]/30 hover:bg-[#3B82F6]/10 hover:text-[#06B6D4]"
              title="Service Provider & Volunteer Onboarding"
            >
              <span className="size-1.5 rounded-full bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.6)]" />
              <span>Become a Helper</span>
            </button>
          )}

          <Button
            size="sm"
            onClick={handleRequestCareClick}
            className="cursor-pointer gap-1 sm:gap-1.5 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[#3B82F6]/20 hover:shadow-md hover:shadow-black/40 border border-[#06B6D4]/30 transition-all active:scale-[0.98] shrink-0"
          >
            <Heart className="size-3.5 sm:size-4 fill-white text-white shrink-0" />
            <span className="hidden xs:inline">Request Care</span>
            <span className="xs:hidden">Request</span>
          </Button>

          <div className="flex items-center pl-1 sm:pl-3 ml-0.5 sm:ml-2 border-l border-white/10">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("dashboard")}
                  className="cursor-pointer gap-1 sm:gap-1.5 rounded-full border-[#06B6D4]/30 bg-[#3B82F6]/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-[#06B6D4] hover:border-[#06B6D4]/50 hover:bg-[#3B82F6]/20 hover:text-white transition-all shadow-xs shrink-0"
                >
                  <LayoutDashboard className="size-3.5 sm:size-4 text-[#06B6D4]" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1 rounded-full border-white/10 bg-white/[0.03] text-[#94A3B8] hover:border-[#EF4444]/40 hover:bg-[#EF4444]/10 hover:text-[#EF4444] px-2 sm:px-3 shrink-0"
                    >
                      <LogOut className="size-3.5 sm:size-4 text-[#EF4444]" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-[#06B6D4]/20 bg-[#1E293B] text-[#F8FAFC]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[#F8FAFC]">Sign out of Wanes?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#94A3B8]">
                        You'll need to sign in again to access your active care requests.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10 bg-[#1E293B] text-[#F8FAFC] hover:bg-[#334155]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await signOut()
                          navigate("home")
                        }}
                        className="bg-[#EF4444] text-white hover:bg-[#DC2626]"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAuthModalMode("signin")
                  setAuthModalUserType("client")
                  setAuthModalOpen(true)
                }}
                className="cursor-pointer gap-1 sm:gap-2 rounded-full border border-[#06B6D4]/30 bg-[#1E293B] hover:bg-[#334155] hover:border-[#06B6D4]/60 hover:text-[#06B6D4] text-[#F8FAFC] px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow-md hover:shadow-black/40 transition-all active:scale-[0.98] shrink-0"
              >
                <LogIn className="size-3.5 sm:size-4 text-[#3B82F6]" />
                <span>Log In</span>
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-300 hover:text-white shrink-0 size-8 sm:size-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-[#06B6D4]/20 bg-[#0F172A]/95 px-4 py-4 backdrop-blur-2xl lg:hidden max-h-[calc(100svh-4rem)] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRequestCareClick}
              className="w-full justify-center gap-2 bg-[#3B82F6] font-bold text-white shadow-sm shadow-[#3B82F6]/15 hover:bg-[#2563EB] border border-[#06B6D4]/30"
            >
              <Heart className="size-4 fill-white" />
              <span>Request Care Now</span>
            </Button>

            <div className="my-1 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.target}
                  href={`#${link.target}`}
                  onClick={(e) => handleAnchorClick(link.target, e)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-[#06B6D4]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="my-1 h-px bg-white/10" />

            {!isClient && !user && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate("volunteer")
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#06B6D4]/20 bg-[#1E293B] p-3 text-left text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#06B6D4]/50 hover:bg-[#1E293B]"
                >
                  <div className="flex items-center gap-2.5">
                    <HeartHandshake className="size-4 text-[#3B82F6]" />
                    <div>
                      <p className="font-bold text-[#F8FAFC]">Become a Helper / Companion</p>
                      <p className="text-[11px] text-[#94A3B8]">Earn hours, credits, or companion payouts</p>
                    </div>
                  </div>
                  <span className="text-[#06B6D4] text-xs">Join &rarr;</span>
                </button>
                <div className="my-1 h-px bg-white/10" />
              </>
            )}

            {user ? (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate("dashboard")
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC]"
                >
                  <LayoutDashboard className="size-4 text-[#3B82F6]" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false)
                    await signOut()
                    navigate("home")
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#EF4444] hover:bg-white/5 hover:text-red-300"
                >
                  <LogOut className="size-4 text-[#EF4444]" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModalMode("signin")
                    setAuthModalUserType("client")
                    setAuthModalOpen(true)
                  }}
                  className="flex-1 justify-center gap-1.5 border-[#06B6D4]/20 bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]"
                >
                  <LogIn className="size-4 text-[#3B82F6]" />
                  <span>Log In</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModalMode("signup")
                    setAuthModalUserType("client")
                    setAuthModalOpen(true)
                  }}
                  className="flex-1 justify-center gap-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                >
                  <UserPlus className="size-4" />
                  <span>Sign Up</span>
                </Button>
              </div>
            )}

            <div className="pt-1">
              <SimpleModeButton variant="mobile" />
            </div>
          </div>
        </nav>
      )}

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authModalMode}
        userType={authModalUserType}
      />
    </header>
  )
}