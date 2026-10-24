import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  ClipboardList,
  Brain,
  ShieldAlert,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowDownCircle,
  Clock,
  ShieldCheck,
} from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

type JourneyStep = {
  num: string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  badge: string
  highlights: string[]
}

const steps: JourneyStep[] = [
  {
    num: "01",
    title: "Request Assistance",
    subtitle: "Simple, Accessible Intake",
    description:
      "Post your needed assistance in under 60 seconds using our one-tap form, voice input, or phone hotline. Choose companion preferences, urgency, and specific instructions.",
    icon: <ClipboardList className="size-6" />,
    badge: "Fast Intake",
    highlights: ["Voice & One-Tap Input", "Senior Accessibility Mode", "Custom Urgency Levels"],
  },
  {
    num: "02",
    title: "Vetted Companion Match",
    subtitle: "Local Screening & Fast Dispatch",
    description:
      "Our system pairs your request with verified, background-checked local helpers in your immediate neighborhood within 15 minutes.",
    icon: <Brain className="size-6" />,
    badge: "Neighborhood Match",
    highlights: ["100% Background-Checked", "Local Proximity Dispatch", "Transparent Helper Profiles"],
  },
  {
    num: "03",
    title: "Live Monitored Care",
    subtitle: "Real-Time Telemetry & SOS Protection",
    description:
      "Stay informed with real-time arrival updates, live check-ins, and direct family status notifications with instant emergency SOS protection.",
    icon: <ShieldAlert className="size-6" />,
    badge: "Family Peace of Mind",
    highlights: ["Real-time GPS Tracking", "1-Tap Emergency SOS", "Instant Family Updates"],
  },
  {
    num: "04",
    title: "Care Confirmed & Protected Pay",
    subtitle: "Satisfaction Guarantee & Free First Visit",
    description:
      "Confirm your satisfaction only after the visit is happily completed. Enjoy a 100% free first visit, protected payments, and zero surprise fees.",
    icon: <Award className="size-6" />,
    badge: "Guaranteed Satisfaction",
    highlights: ["100% Free First Visit", "Protected Escrow Payment", "Direct Support Hotline"],
  },
]

export function ServiceJourney() {
  const [activeStep, setActiveStep] = React.useState(0)
  const activeStepRef = React.useRef(0)
  const sectionRef = React.useRef<HTMLElement>(null)
  const progressBarRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=2500",
        pin: true,
        pinSpacing: true,
        scrub: 0.3,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress
          const nextStep = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3
          if (nextStep !== activeStepRef.current) {
            activeStepRef.current = nextStep
            setActiveStep(nextStep)
          }

          if (progressBarRef.current) {
            progressBarRef.current.style.height = `${p * 100}%`
          }
        },
      })
    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background py-16 sm:py-20"
    >
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-full -translate-x-1/2 opacity-5 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.1), transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Simple 4-Step Client Journey
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            How Requesting Care Works
          </h2>
          <p className="mt-3 text-base text-[#94A3B8] sm:text-lg">
            From your initial request to safe completion, your family is in control every step of the way.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="relative pl-8 sm:pl-10">
              <div className="absolute left-3.5 top-3 bottom-3 w-1 rounded-full bg-white/[0.08] sm:left-4">
                <div
                  ref={progressBarRef}
                  className="w-full origin-top rounded-full bg-gradient-to-b from-[#3B82F6] via-[#06B6D4] to-[#059669] shadow-sm shadow-[#3B82F6]/25"
                  style={{ height: "0%" }}
                />
              </div>

              <div className="space-y-6 sm:space-y-8">
                {steps.map((step, idx) => {
                  const isActive = activeStep === idx
                  const isCompleted = activeStep > idx

                  return (
                    <div
                      key={step.num}
                      className={`relative flex cursor-default items-start gap-4 transition-all duration-300 ${
                        isActive
                          ? "opacity-100 translate-x-1"
                          : isCompleted
                          ? "opacity-80"
                          : "opacity-40"
                      }`}
                    >
                      <div
                        className={`relative z-10 flex size-8 shrink-0 -translate-x-[21px] sm:-translate-x-[22px] items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? "border-[#3B82F6] bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/25 scale-110"
                            : isCompleted
                            ? "border-[#059669] bg-[#059669] text-white"
                            : "border-white/[0.1] bg-[#1E293B] text-[#94A3B8]"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <span className="text-xs font-bold">{step.num}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                              isActive
                                ? "text-[#06B6D4]"
                                : isCompleted
                                ? "text-[#059669]"
                                : "text-[#94A3B8]"
                            }`}
                          >
                            Step {step.num}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-[10px] font-bold text-[#06B6D4] animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-base font-bold sm:text-lg transition-colors ${
                            isActive ? "text-[#F8FAFC]" : "text-[#94A3B8]"
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="line-clamp-1 text-xs text-[#94A3B8]">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-[#1E293B] p-6 sm:p-8 md:p-10 border border-[#06B6D4]/20 backdrop-blur-xl shadow-2xl transition-all duration-500">
                <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#3B82F6]/3 blur-2xl" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-[#06B6D4]/2 blur-2xl" />

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/15 border border-[#06B6D4]/30">
                      {steps[activeStep].icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                          Phase {steps[activeStep].num} of 04
                        </span>
                        <span className="inline-block size-1.5 rounded-full bg-[#06B6D4]" />
                        <span className="text-xs text-[#94A3B8]">
                          {steps[activeStep].badge}
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-[#F8FAFC] sm:text-3xl">
                        {steps[activeStep].title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-[#06B6D4]/20 bg-[#0F172A] px-3 py-1 text-xs font-semibold text-[#94A3B8]">
                    <Clock className="size-3.5 text-[#3B82F6]" />
                    Instant Dispatch
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[#06B6D4]">
                    {steps[activeStep].subtitle}
                  </h4>
                  <p className="mt-2 text-base sm:text-lg text-[#94A3B8] leading-relaxed">
                    {steps[activeStep].description}
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {steps[activeStep].highlights.map((highlight, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl border border-[#06B6D4]/15 bg-[#0F172A] p-3 text-xs font-medium text-[#F8FAFC] backdrop-blur-md transition-colors hover:border-[#06B6D4]/40"
                    >
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/20 text-[#06B6D4]">
                        <ShieldCheck className="size-3" />
                      </div>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between rounded-xl border border-[#06B6D4]/15 bg-[#0F172A] px-4 py-3 text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#059669] opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-[#059669]" />
                    </span>
                    <span>Scroll down to continue journey</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#06B6D4] font-semibold">
                    <span>Stage {activeStep + 1}/4</span>
                    <ArrowDownCircle className="size-4 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
