import * as React from "react"
import { useRouter } from "@/lib/router"
import { Navbar } from "@/components/sections/navbar"
import { Hero } from "@/components/sections/hero"
import { ServiceJourney } from "@/components/sections/service-journey"
import { PricingPlans } from "@/components/sections/pricing-plans"
import { ContactSection } from "@/components/sections/contact-section"
import { SosSection } from "@/components/sections/sos-section"
import { ImpactTrust } from "@/components/sections/impact-trust"
import { Footer } from "@/components/sections/footer"
import { VoiceAssistant } from "@/components/voice/voice-assistant"
import { VideoModal } from "@/components/sections/video-modal"
import { type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

const SignInPage = React.lazy(() =>
  import("@/components/pages/sign-in").then((m) => ({ default: m.SignInPage }))
)
const SignUpPage = React.lazy(() =>
  import("@/components/pages/sign-up").then((m) => ({ default: m.SignUpPage }))
)
const DashboardPage = React.lazy(() =>
  import("@/components/pages/dashboard").then((m) => ({ default: m.DashboardPage }))
)
const ServicesPage = React.lazy(() =>
  import("@/components/pages/services").then((m) => ({ default: m.ServicesPage }))
)
const SafetyPage = React.lazy(() =>
  import("@/components/pages/safety").then((m) => ({ default: m.SafetyPage }))
)
const VolunteerPage = React.lazy(() =>
  import("@/components/pages/volunteer").then((m) => ({ default: m.VolunteerPage }))
)
const CreateRequestPage = React.lazy(() =>
  import("@/components/pages/create-request").then((m) => ({ default: m.CreateRequestPage }))
)
const NotificationsPage = React.lazy(() =>
  import("@/components/pages/notifications").then((m) => ({ default: m.NotificationsPage }))
)
const CheckoutPage = React.lazy(() =>
  import("@/components/pages/checkout").then((m) => ({ default: m.CheckoutPage }))
)
import { VerificationGatekeeper } from "@/components/verification/verification-gatekeeper"
const AdminVerificationPage = React.lazy(() =>
  import("@/components/admin/admin-verification-dashboard").then((m) => ({ default: m.AdminVerificationDashboard }))
)

import { AIAssistantWidget } from "@/components/ai-assistant/ai-assistant-widget"
import { UrgentServiceButton } from "@/components/urgent/urgent-service-button"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import {
  getPendingRequestIntent,
  setPendingRequestIntent,
  clearPendingRequestIntent,
} from "@/lib/pending-request"
import { toast } from "sonner"

import { ClientServicesSection } from "@/components/sections/client-services"
import { RequestModal } from "@/components/sections/request-modal"

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground animate-pulse">Loading Wanes...</p>
      </div>
    </div>
  )
}

function HomePage() {
  const { session } = useAuth()
  const { navigate } = useRouter()
  const [voiceAssistantOpen, setVoiceAssistantOpen] = React.useState(false)
  const [videoModalOpen, setVideoModalOpen] = React.useState(false)
  const [requestModalOpen, setRequestModalOpen] = React.useState(false)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [authIntentMessage, setAuthIntentMessage] = React.useState<string | null>(null)
  const [requestPrefill, setRequestPrefill] = React.useState<{
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
  } | null>(null)

  React.useEffect(() => {
    if (session) {
      const pending = getPendingRequestIntent()
      if (pending) {
        setRequestPrefill(pending)
        clearPendingRequestIntent()
        setRequestModalOpen(true)
        toast.success("Welcome! Resuming your service request.")
      }
    }
  }, [session])

  React.useEffect(() => {
    function handleRequestModalTrigger(e: any) {
      const draft = e?.detail
      if (draft) {
        setRequestPrefill({
          title: draft.title || "Companion Care Visit",
          category: draft.category || "senior_care",
          urgency: draft.urgency || "normal",
          description: draft.description || "",
        })
      }
      setRequestModalOpen(true)
    }

    window.addEventListener("wanes:open-request-modal", handleRequestModalTrigger)
    window.addEventListener("nova:open-request-modal", handleRequestModalTrigger)
    return () => {
      window.removeEventListener("wanes:open-request-modal", handleRequestModalTrigger)
      window.removeEventListener("nova:open-request-modal", handleRequestModalTrigger)
    }
  }, [])

  function handleOpenRequest(category: RequestCategory = "senior_care", defaultTitle?: string) {
    const draft = {
      title: defaultTitle || "Care Assistance Request",
      category,
      urgency: "normal" as RequestUrgency,
      description: "",
    }

    if (!session) {
      setPendingRequestIntent(draft)
      setRequestPrefill(draft)
      setAuthIntentMessage(`Sign in or create a client account to request "${draft.title}".`)
      setAuthModalOpen(true)
      return
    }

    setRequestPrefill(draft)
    setRequestModalOpen(true)
  }

  function handleVoiceParsed(data: {
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
  }) {
    const draft = {
      title: data.title,
      category: data.category,
      urgency: data.urgency,
      description: data.description,
    }

    if (!session) {
      setPendingRequestIntent(draft)
      setRequestPrefill(draft)
      setAuthIntentMessage(`Sign in or create a client account to submit "${draft.title}".`)
      setAuthModalOpen(true)
      return
    }

    setRequestPrefill(draft)
    setRequestModalOpen(true)
  }

  function handleAuthSuccess() {
    const pending = getPendingRequestIntent()
    if (pending) {
      setRequestPrefill(pending)
      clearPendingRequestIntent()
      setRequestModalOpen(true)
      toast.success("Welcome! Resuming your service request.")
    } else {
      navigate("dashboard")
    }
  }

  return (
    <>
      <Navbar
        onOpenRequestModal={() => handleOpenRequest("senior_care", "Care Assistance Request")}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />
      <main>
        <Hero
          onOpenVideoModal={() => setVideoModalOpen(true)}
          onRequestCare={(category, title) => handleOpenRequest(category, title)}
          onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
        />
        <ClientServicesSection
          onRequestService={(category, title) => handleOpenRequest(category, title)}
        />
        <ServiceJourney />
        <SosSection />
        <PricingPlans />
        <ImpactTrust />
        <ContactSection />
      </main>
      <Footer />

      <RequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        prefillData={requestPrefill}
      />
      <VoiceAssistant
        open={voiceAssistantOpen}
        onOpenChange={setVoiceAssistantOpen}
        onParsedRequest={handleVoiceParsed}
      />
      <VideoModal open={videoModalOpen} onOpenChange={setVideoModalOpen} />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="signup"
        initialRole="standard_requester"
        userType="client"
        intentMessage={authIntentMessage}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}

export function App() {
  const { route } = useRouter()

  let content: React.ReactNode
  switch (route) {
    case "signin":
      content = <SignInPage />
      break
    case "signup":
      content = <SignUpPage />
      break
    case "dashboard":
      content = <DashboardPage />
      break
    case "services":
      content = <ServicesPage />
      break
    case "safety":
      content = <SafetyPage />
      break
    case "volunteer":
      content = <VolunteerPage />
      break
    case "create-request":
      content = <CreateRequestPage />
      break
    case "notifications":
      content = <NotificationsPage />
      break
    case "checkout":
      content = <CheckoutPage />
      break
    case "verification":
      content = <VerificationGatekeeper />
      break
    case "admin":
      content = <AdminVerificationPage />
      break
    default:
      content = <HomePage />
  }

  return (
    <div className="min-h-svh bg-background">
      <React.Suspense fallback={<RouteLoadingFallback />}>
        {content}
      </React.Suspense>
      <AIAssistantWidget />
      <UrgentServiceButton />
    </div>
  )
}

export default App
