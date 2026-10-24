import * as React from "react"
import {
  Award,
  Clock,
  CheckCircle2,
  HeartHandshake,
  Shield,
  Brain,
  HandHeart,
  Loader2,
  ArrowLeft,
  Coins,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Navbar } from "@/components/sections/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/lib/router"
import { useAuth } from "@/lib/auth-context"
import { supabase, type VolunteerImpactLedger } from "@/lib/supabase"
import { toast } from "sonner"

const onboardingSteps = [
  {
    icon: <Shield className="size-5 text-[#3B82F6]" />,
    title: "1. Service Preferences & Registration",
    description: "Register your account and select whether you want to offer volunteer companionship or paid care visits.",
  },
  {
    icon: <Brain className="size-5 text-[#3B82F6]" />,
    title: "2. Skills & Schedule Selection",
    description: "Select which types of help you offer (companionship, errands, tech, mobility) and set your availability.",
  },
  {
    icon: <HandHeart className="size-5 text-[#3B82F6]" />,
    title: "3. Accept Requests & Build Impact",
    description: "Browse nearby tasks in your neighborhood, accept assignments, and earn verified impact hours or direct payouts.",
  },
]

const skillOptions = [
  "Senior Companionship",
  "Grocery Shopping & Errand Runs",
  "Pharmacy Pickup",
  "Smartphone & Tablet Setup",
  "WiFi & Computer Guidance",
  "Wheelchair & Walking Escort",
  "Hospital & Clinic Visit Escort",
  "Home Safety Checkups",
  "Emergency Rapid Response",
]

export function VolunteerPage() {
  const { navigate } = useRouter()
  const { session, profile, refreshProfile } = useAuth()
  const isClient = !!session && (profile?.role === "standard_requester" || profile?.role === "senior_requester" || !profile?.role)
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([
    "Senior Companionship",
    "Grocery Shopping & Errand Runs",
  ])
  const [impactLedger, setImpactLedger] = React.useState<VolunteerImpactLedger[]>([])
  const [, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  const isMountedRef = React.useRef(true)
  React.useEffect(() => {
    isMountedRef.current = true
    if (isClient) {
      toast.info("Your account is registered as a Care Requester. Helper onboarding is disabled for client accounts.")
      navigate("dashboard")
    }
    return () => {
      isMountedRef.current = false
    }
  }, [isClient, navigate])

  React.useEffect(() => {
    async function fetchImpact() {
      if (!session) {
        if (isMountedRef.current) setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from("volunteer_impact_ledger")
          .select("*")
          .eq("volunteer_id", session.user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error(error.message)
        } else if (isMountedRef.current) {
          setImpactLedger((data as VolunteerImpactLedger[]) || [])
        }
      } catch {
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }
    fetchImpact()
  }, [session?.user?.id])

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  async function handleStartOnboarding() {
    if (!session) {
      toast.info("Please create a provider account or sign in to continue.")
      navigate("signup", { type: "provider", role: "volunteer" })
      return
    }

    if (isClient) {
      toast.info("Your account is registered as a Care Requester. Helper onboarding is disabled for client accounts.")
      navigate("dashboard")
      return
    }

    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill to continue.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "volunteer", is_verified: true })
        .eq("id", session.user.id)

      if (error) {
        toast.error("Unable to update your profile. Please try again.")
        console.error(error.message)
      } else {
        await refreshProfile()
        toast.success("Provider onboarding complete! Directing you to your companion dashboard.")
        navigate("dashboard")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const totalPoints = impactLedger.reduce((sum, l) => sum + l.impact_points, 0)
  const totalHours = impactLedger.reduce((sum, l) => sum + Number(l.hours_completed), 0)
  const verifiedCount = impactLedger.filter((l) => l.signed_off_by_requester).length

  return (
    <div className="min-h-svh bg-[#0F172A] text-[#F8FAFC]">
      <Navbar onOpenRequestModal={() => navigate("create-request")} onOpenVoiceAssistant={() => {}} />

      <div className="pt-24 pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between border-b border-white/[0.08] pb-4">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-[#3B82F6]"
            >
              <ArrowLeft className="size-3.5" />
              <span>Looking for care instead? Go to Client Homepage</span>
            </button>
            <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">
              Dedicated Provider Portal
            </span>
          </div>

          {isClient && (
            <div className="mb-8 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-5 text-center text-xs text-[#3B82F6] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-[#3B82F6] shrink-0" />
                <span>You are currently logged in as a <strong>Service Requester / Client</strong>. Helper onboarding is disabled to protect your account.</span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("dashboard")}
                className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-bold text-xs h-8 px-4 rounded-xl shrink-0 cursor-pointer"
              >
                Go to My Care Dashboard
              </Button>
            </div>
          )}

          <div className="mb-12 text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold text-[#3B82F6]">
              <Sparkles className="size-3.5 text-[#3B82F6]" />
              <span>Join Wanes Provider &amp; Helper Network</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[#F8FAFC]">
              Become a Trusted Care Companion
            </h1>

            <p className="text-base text-[#94A3B8] sm:text-lg">
              Make a meaningful difference for local seniors and families. Choose your path: volunteer for
              certified community hours &amp; university credits, or earn money as a paid companion with flexible local visits.
            </p>
          </div>

          <div className="mb-14 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6]">
                    <HeartHandshake className="size-6" />
                  </div>
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30">
                    Civic Service Track
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">Community Volunteer</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                  Earn accredited volunteer service hours, build verified digital badges, and receive signed letters of recommendation for college and work.
                </p>
                <ul className="space-y-2 text-xs text-[#94A3B8] border-t border-white/[0.08] pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>Cryptographically verified community service logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>University credit badges &amp; civic recognition</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>Flexible schedule—choose 1 to 10 hours per week</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => navigate("signup", { type: "provider", role: "volunteer" })}
                className="w-full cursor-pointer bg-[#0F172A] border border-white/[0.08] text-[#F8FAFC] hover:bg-[#1E293B] hover:border-[#3B82F6]/40 font-bold"
              >
                Sign Up as Volunteer
              </Button>
            </div>

            <div className="rounded-2xl border border-[#06B6D4]/30 bg-[#1E293B] p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6] text-white font-bold">
                    <Coins className="size-6" />
                  </div>
                  <Badge className="bg-[#059669]/20 text-[#059669] border-[#059669]/30">
                    Earn Direct Income
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">Paid Companion</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                  Earn an 80% payout per completed visit via secure escrow. Provide senior accompaniment, errand fulfillment, and appointment escort.
                </p>
                <ul className="space-y-2 text-xs text-[#94A3B8] border-t border-white/[0.08] pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>80% direct payout hold released on visit sign-off</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>Weekly payout deposits directly to your bank / wallet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                    <span>Full coverage by 24/7 emergency dispatch desk</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => navigate("signup", { type: "provider", role: "paid_companion" })}
                className="w-full cursor-pointer bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-bold shadow-md shadow-[#3B82F6]/20"
              >
                Sign Up as Paid Companion
              </Button>
            </div>
          </div>

          {session && impactLedger.length > 0 && (
            <div className="mb-12 grid gap-4 sm:grid-cols-3">
              <Card className="glass-card bg-[#1E293B]/85 border-white/[0.08]">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                    <Award className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#F8FAFC]">{totalPoints}</p>
                    <p className="text-xs text-[#94A3B8]">Total Impact Points</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card bg-[#1E293B]/85 border-white/[0.08]">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#F8FAFC]">{totalHours.toFixed(1)}</p>
                    <p className="text-xs text-[#94A3B8]">Completed Service Hours</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card bg-[#1E293B]/85 border-white/[0.08]">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669]">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#F8FAFC]">{verifiedCount}</p>
                    <p className="text-xs text-[#94A3B8]">Verified Client Visits</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-[#F8FAFC]">How Provider Onboarding Works</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {onboardingSteps.map((step, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-6 backdrop-blur-xl">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 font-bold text-[#F8FAFC]">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-[#94A3B8]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-14 rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-6 sm:p-8 backdrop-blur-xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#F8FAFC]">Select Your Assistance Capabilities</h2>
            <p className="mb-6 text-sm text-[#94A3B8]">
              Pick the service categories you feel comfortable fulfilling. You can adjust these anytime in your provider settings.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white font-bold shadow-md shadow-[#3B82F6]/20"
                      : "border-white/[0.08] bg-[#0F172A]/80 text-[#94A3B8] hover:border-[#3B82F6]/30 hover:text-[#F8FAFC]"
                  }`}
                >
                  {selectedSkills.includes(skill) && <CheckCircle2 className="mr-1.5 inline size-3.5" />}
                  {skill}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#94A3B8]">
                {selectedSkills.length} capability categories selected for local matching.
              </p>
              <Button
                size="lg"
                onClick={handleStartOnboarding}
                disabled={submitting}
                className="cursor-pointer gap-2 bg-[#3B82F6] font-bold text-white hover:bg-[#3B82F6]/90 shadow-lg shadow-[#3B82F6]/20"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <HeartHandshake className="size-4" />
                    <span>{session ? "Complete Profile & Start" : "Register as Helper"}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

