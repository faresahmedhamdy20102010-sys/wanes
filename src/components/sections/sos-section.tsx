import * as React from "react"
import {
  ShieldAlert,
  Users,
  Navigation,
  Headphones,
  Zap,
  Check,
  RotateCcw,
  Play,
  Pause,
  Wifi,
  Signal,
  BatteryCharging,
  Radio,
  Activity,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/lib/router"

type TelemetryItem = {
  id: string
  label: string
  activeStatus: string
  pendingStatus: string
}

const telemetryItems: TelemetryItem[] = [
  {
    id: "triggered",
    label: "SOS triggered",
    activeStatus: "0.1s · Dispatched",
    pendingStatus: "Standby",
  },
  {
    id: "family",
    label: "Family notified",
    activeStatus: "SMS + Push Sent",
    pendingStatus: "Queued",
  },
  {
    id: "gps",
    label: "GPS tracking link",
    activeStatus: "Live Beacon Active",
    pendingStatus: "Waiting",
  },
  {
    id: "dispatch",
    label: "Wanes support dispatched",
    activeStatus: "Ops Desk Online",
    pendingStatus: "Ready",
  },
]

type GuideStep = {
  num: string
  title: string
  description: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
}

const guideSteps: GuideStep[] = [
  {
    num: "01",
    title: "One-tap SOS trigger",
    description: "A single press flags an emergency — no menus, no dialing.",
    detail: "Immediate hardware-accelerated trigger locks in location and priority queue.",
    icon: Zap,
  },
  {
    num: "02",
    title: "Instant family alerts",
    description: "SMS & push notifications to linked contacts.",
    detail: "Designated kin receive real-time SMS alerts and map coordinates simultaneously.",
    icon: Users,
  },
  {
    num: "03",
    title: "Live GPS location tracking",
    description: "Real-time movement and volunteer telemetry.",
    detail: "Continuous pinpoint telemetry with breadcrumb trail and safety zone fencing.",
    icon: Navigation,
  },
  {
    num: "04",
    title: "24/7 Wanes support dispatch",
    description: "Operations center notified simultaneously.",
    detail: "Dedicated emergency coordinators monitor telemetry until resolution is confirmed.",
    icon: Headphones,
  },
]

const STEP_DURATION = 3500

export function SosSection() {
  const { navigate } = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(true)

  React.useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % guideSteps.length)
    }, STEP_DURATION)

    return () => clearInterval(timer)
  }, [isPlaying])

  function handleRestart() {
    setCurrentStep(0)
    setIsPlaying(true)
  }

  return (
    <section id="sos" className="relative overflow-hidden bg-[#0F172A] py-16 sm:py-32 lg:py-36">
      <div className="pointer-events-none absolute -top-24 left-1/4 size-96 rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 size-96 rounded-full bg-red-500/10 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#EF4444] shadow-sm shadow-[#EF4444]/10">
            <ShieldAlert className="size-3.5 text-[#EF4444]" />
            <span>Dedicated Rapid Safety Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
            Guarded Emergency Response,{" "}
            <span className="bg-gradient-to-r from-[#EF4444] via-[#F87171] to-[#EF4444] bg-clip-text text-transparent">
              Built for Absolute Peace of Mind
            </span>
          </h2>

          <p className="text-sm sm:text-lg text-[#94A3B8] leading-relaxed text-balance">
            Every interaction is fortified by real-time safety telemetry. A protected 3-second hold prevents accidental activations while instantly connecting your family to verified nearby helpers and our 24/7 dispatch desk.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[340px] sm:max-w-sm rounded-[2rem] sm:rounded-[2.5rem] border border-[#EF4444]/25 bg-[#1E293B] p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
              <div className="mx-auto mb-3 flex h-4 w-28 items-center justify-between rounded-full bg-black px-2.5 shadow-inner">
                <div className="size-2 rounded-full border border-white/10 bg-[#0F172A]" />
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <div className="size-2 rounded-full bg-black ring-1 ring-white/10" />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between px-2 text-[11px] font-medium text-[#94A3B8]">
                <span className="font-mono">9:41</span>
                <div className="flex items-center gap-2">
                  <Wifi className="size-3 text-[#94A3B8]" />
                  <Signal className="size-3 text-[#94A3B8]" />
                  <BatteryCharging className="size-3.5 text-[#EF4444]" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]">
                      <ShieldAlert className="size-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#F8FAFC] leading-tight">Wanes Sentinel</p>
                      <p className="text-[10px] text-[#94A3B8]">Active Safety Guard</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="size-1.5 animate-ping rounded-full bg-emerald-400" />
                    Live 24/7
                  </span>
                </div>

                <div className="relative my-2 flex flex-col items-center justify-center">
                  <div className="relative flex size-36 items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-[#EF4444]/40 via-rose-500/25 to-[#EF4444]/35 blur-xl animate-pulse" />
                    <div className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-[#EF4444]/35 opacity-40" />
                    <div className="pointer-events-none absolute inset-1.5 rounded-full border border-[#EF4444]/25 opacity-70" />

                    <div
                      className="group relative flex size-28 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-[#EF4444] via-red-600 to-[#DC2626] p-0 text-white shadow-[0_0_35px_rgba(239,68,68,0.6),inset_0_2px_8px_rgba(255,255,255,0.3)] ring-4 ring-[#EF4444]/40"
                    >
                      <div className="pointer-events-none absolute inset-1 rounded-full border border-white/25 bg-gradient-to-b from-white/20 to-transparent opacity-75" />

                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <Radio className="mb-0.5 size-4.5 animate-pulse text-white" />
                        <span className="text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                          SOS
                        </span>
                        <span className="text-[8.5px] font-bold uppercase tracking-widest text-red-100">
                          3s Guard
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-center text-[11px] font-medium text-[#94A3B8]">
                    3-Second Protected Hold · Prevents False Alarms
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3.5 backdrop-blur-md">
                  <div className="mb-2.5 flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      <Activity className="size-3.5 text-[#EF4444]" />
                      Protocol Telemetry Simulation
                    </div>
                    <span className="font-mono text-[10px] font-medium text-[#EF4444]">
                      {currentStep >= 3 ? "All Linked" : `Phase 0${currentStep + 1}/04`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {telemetryItems.map((item, idx) => {
                      const isDone = currentStep >= idx
                      const isCurrent = currentStep === idx
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-xl px-2.5 py-2 transition-all duration-300 ${
                            isCurrent
                              ? "border border-[#EF4444]/40 bg-[#EF4444]/10 text-white shadow-sm"
                              : isDone
                              ? "border border-white/5 bg-[#1E293B] text-[#F8FAFC]"
                              : "border border-transparent bg-transparent text-[#94A3B8]/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full transition-all ${
                                isDone
                                  ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                  : "border border-white/10 bg-[#0F172A] text-[#94A3B8]"
                              }`}
                            >
                              {isDone ? (
                                <Check className="size-3 stroke-[3]" />
                              ) : (
                                <span className="size-1.5 rounded-full bg-slate-600" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                isDone ? "text-[#F8FAFC]" : "text-[#94A3B8]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`font-mono text-[10px] ${
                              isCurrent
                                ? "animate-pulse font-bold text-[#EF4444]"
                                : isDone
                                ? "text-emerald-400 font-medium"
                                : "text-slate-600"
                            }`}
                          >
                            {isDone ? item.activeStatus : item.pendingStatus}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#94A3B8] transition-colors hover:text-white"
                  >
                    <RotateCcw className="size-3.5 text-[#3B82F6]" />
                    Restart showcase
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#94A3B8] transition-colors hover:text-white"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="size-3.5 text-[#3B82F6]" />
                        <span>Auto-cycling</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5 text-[#3B82F6]" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mx-auto mt-4 h-1 w-28 rounded-full bg-white/20" />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="space-y-3.5">
              {guideSteps.map((step, idx) => {
                const isActive = currentStep === idx
                const IconComponent = step.icon
                return (
                  <div
                    key={step.num}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setCurrentStep(idx)
                      setIsPlaying(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setCurrentStep(idx)
                        setIsPlaying(false)
                      }
                    }}
                    className={`group relative flex cursor-pointer items-start gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 ${
                      isActive
                        ? "border border-[#06B6D4]/35 bg-[#1E293B] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                        : "border border-[#06B6D4]/15 bg-[#1E293B] hover:border-[#06B6D4]/30 hover:bg-[#1E293B] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <div
                      className={`flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive
                          ? "border border-[#06B6D4]/30 bg-[#3B82F6]/15 text-[#06B6D4] shadow-sm"
                          : "border border-white/10 bg-[#0F172A] text-[#94A3B8] group-hover:border-[#06B6D4]/30 group-hover:text-[#06B6D4]"
                      }`}
                    >
                      <IconComponent className="size-5 sm:size-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isActive
                                ? "text-[#06B6D4]"
                                : "text-[#94A3B8] group-hover:text-[#06B6D4]/80"
                            }`}
                          >
                            PHASE {step.num}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#06B6D4]">
                              Active Phase
                            </span>
                          )}
                        </div>
                        <ArrowRight
                          className={`size-4 transition-transform duration-300 shrink-0 ${
                            isActive
                              ? "translate-x-0 text-[#06B6D4] opacity-100"
                              : "-translate-x-1 text-slate-600 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[#94A3B8]"
                          }`}
                        />
                      </div>

                      <h3
                        className={`mt-1.5 text-base font-bold sm:text-lg transition-colors ${
                          isActive ? "text-[#F8FAFC]" : "text-[#F8FAFC]/90 group-hover:text-[#F8FAFC]"
                        }`}
                      >
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm text-[#94A3B8] leading-relaxed">
                        {step.description}
                      </p>

                      <p
                        className={`mt-1.5 text-xs transition-colors ${
                          isActive ? "text-[#06B6D4] font-medium" : "text-[#94A3B8]/70"
                        }`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-3 sm:pt-4">
              <Button
                size="lg"
                onClick={() => navigate("safety")}
                className="cursor-pointer gap-2 bg-[#3B82F6] hover:bg-[#2563EB] font-semibold text-white shadow-sm shadow-[#3B82F6]/15 border border-[#06B6D4]/30 w-full sm:w-auto justify-center"
              >
                <ShieldAlert className="size-4 text-white" />
                Explore Safety Protocols
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("signup")}
                className="cursor-pointer gap-2 border-[#06B6D4]/20 bg-[#1E293B] text-[#F8FAFC] hover:border-[#06B6D4]/40 hover:bg-[#334155] hover:text-white w-full sm:w-auto justify-center"
              >
                Join Wanes Network
                <ArrowRight className="size-4 text-[#06B6D4]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

