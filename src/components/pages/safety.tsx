import {
  ShieldCheck,
  BadgeCheck,
  ShieldAlert,
  Lock,
  FileCheck,
  Eye,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Navbar } from "@/components/sections/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/lib/router"

const verificationSteps = [
  {
    icon: <FileCheck className="size-6" />,
    title: "Identity Verification",
    description:
      "Every volunteer must verify their identity using a government-issued national ID before they can accept any request. This is a mandatory one-time step during onboarding.",
  },
  {
    icon: <ShieldCheck className="size-6" />,
    title: "Background Screening",
    description:
      "We run criminal background checks on all volunteers. Only those who pass are marked as verified and given access to the request matching system.",
  },
  {
    icon: <BadgeCheck className="size-6" />,
    title: "Community Ratings",
    description:
      "After every completed task, requesters rate their volunteer. A minimum 4-star average is required to remain active on the platform.",
  },
  {
    icon: <Lock className="size-6" />,
    title: "Data Privacy",
    description:
      "Personal contact details and exact addresses are never shared publicly. Only general location areas are visible until a match is confirmed.",
  },
]

const sosProtocols = [
  {
    icon: <AlertTriangle className="size-5" />,
    title: "One-Tap SOS",
    description:
      "A single tap on the SOS button sends a critical alert to all nearby verified volunteers with your location and request context.",
  },
  {
    icon: <Clock className="size-5" />,
    title: "Live Checkpoint Tracking",
    description:
      "Every active task has built-in checkpoints. Families can follow progress in real time and receive notifications at each stage.",
  },
  {
    icon: <Phone className="size-5" />,
    title: "Emergency Contact Integration",
    description:
      "Designated emergency contacts are automatically notified with full context, location, and task details when SOS is triggered.",
  },
  {
    icon: <Eye className="size-5" />,
    title: "Telemetry & Audit Trail",
    description:
      "All interactions are logged with timestamps and location telemetry, creating a transparent audit trail for every task.",
  },
]

export function SafetyPage() {
  const { navigate } = useRouter()

  return (
    <div className="min-h-svh bg-background">
      <Navbar onOpenRequestModal={() => navigate("create-request")} onOpenVoiceAssistant={() => {}} />
      <div className="pt-20">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <ShieldCheck className="size-4" />
              Trust & Safety Center
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Safety Is Our Foundation
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground text-balance">
              Every layer of Wanes is designed to protect our community — from
              identity verification to real-time SOS monitoring.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Volunteer Verification Process</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {verificationSteps.map((step, i) => (
                <Card key={i} className="glass-card p-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">SOS Safety Protocols</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {sosProtocols.map((proto, i) => (
                <Card key={i} className="glass-card flex items-start gap-4 p-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    {proto.icon}
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">{proto.title}</h3>
                    <p className="text-sm text-muted-foreground">{proto.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="glass-card border-[#059669]/30 bg-[#1E293B]/85 p-8 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#059669]/15 text-[#059669] border border-[#059669]/25">
                <ShieldAlert className="size-8 text-[#059669]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#F8FAFC]">Our Safety Commitment</h3>
                <p className="mt-2 text-[#94A3B8] text-balance">
                  We continuously invest in safety infrastructure — from background
                  checks to real-time monitoring — so you can focus on what matters:
                  building meaningful connections across generations.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("signup")} className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-semibold gap-1.5 shadow-sm">
                  <CheckCircle2 className="size-4" />
                  Join Safely
                </Button>
                <Button variant="outline" onClick={() => navigate("signin")} className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] hover:bg-[#1E293B]">
                  Sign In
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
