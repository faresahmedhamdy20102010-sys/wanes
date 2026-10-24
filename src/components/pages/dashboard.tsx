import * as React from "react"
import {
  Users,
  Calendar,
  ShieldAlert,
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Search,
  UserPlus,
  CalendarPlus,
  Radio,
  Menu,
  Heart,
  ShoppingBag,
  Smartphone,
  Accessibility,
  AlertCircle,
  Check,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Coins,
  Award,
  Wallet,
  PhoneCall,
  Sparkles,
  Phone,
  MessageSquare,
  Zap,
} from "lucide-react"
import {
  supabase,
  type AssistanceRequest,
  type Notification,
  type RequestCategory,
  type RequestUrgency,
  type VolunteerImpactLedger,
  type ProfileRole,
  type CompanionWallet,
} from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import {
  DashboardSidebar,
  type DashboardTab,
} from "@/components/dashboard/dashboard-sidebar"
import {
  CareRecipientsDialog,
  getStoredRecipients,
  type CareRecipient,
} from "@/components/dashboard/care-recipients-dialog"
import { SosSafetyModal } from "@/components/dashboard/sos-safety-modal"
import { RequestModal } from "@/components/sections/request-modal"
import { CheckoutModal, type PendingVisitDraft } from "@/components/checkout/checkout-modal"
import { NegotiationModal } from "@/components/negotiation/negotiation-modal"
import { MapViewDialog } from "@/components/location/map-view-dialog"
import { getNegotiationForRequest } from "@/lib/negotiation"
import { getPendingRequestIntent, clearPendingRequestIntent } from "@/lib/pending-request"
import { liveSync } from "@/lib/live-sync"
import { getSimpleMode, setSimpleMode } from "@/lib/simple-mode"
import { mergeWithSharedRequests, updateSharedRequest, SHARED_REQUESTS_KEY } from "@/lib/requests-store"
import { AdminVerificationDashboard } from "@/components/admin/admin-verification-dashboard"
import { DailyServicesCalculator } from "@/components/pricing/daily-services-calculator"

const statusColors: Record<string, string> = {
  open: "bg-[#059669]/15 text-[#059669] border border-[#059669]/30",
  matched: "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30",
  in_progress: "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40",
  completed: "bg-white/10 text-[#94A3B8] border border-white/[0.08]",
  cancelled: "bg-[#0F172A] text-[#94A3B8] border border-white/[0.08]",
}

const urgencyColors: Record<string, string> = {
  normal: "bg-white/10 text-[#94A3B8] border border-white/[0.08]",
  high: "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30",
  critical: "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30",
}

const categoryIcons: Record<RequestCategory, React.ReactNode> = {
  senior_care: <Heart className="size-4" />,
  daily_errands: <ShoppingBag className="size-4" />,
  tech_setup: <Smartphone className="size-4" />,
  mobility_assistance: <Accessibility className="size-4" />,
  emergency_sos: <AlertCircle className="size-4" />,
}

const notifTypeIcons: Record<string, React.ReactNode> = {
  match: <UserCheck className="size-4 text-[#3B82F6]" />,
  request: <Heart className="size-4 text-[#3B82F6]" />,
  sos: <ShieldAlert className="size-4 text-[#EF4444]" />,
  impact: <TrendingUp className="size-4 text-[#059669]" />,
  system: <Bell className="size-4 text-[#94A3B8]" />,
}

export function DashboardPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const { navigate } = useRouter()

  React.useEffect(() => {
    if (!authLoading && !session) {
      toast.info("Please sign in to access your dashboard.")
      navigate("signin")
    }
  }, [authLoading, session, navigate])

  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview")
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const activeRole: ProfileRole = (profile?.role as ProfileRole) || "standard_requester"
  const isCompanion = activeRole === "paid_companion"
  const isVolunteer = activeRole === "volunteer"
  const isProvider = isCompanion || isVolunteer
  const isSenior = activeRole === "senior_requester"
  const isFamily = !isProvider && !isSenior
  const isClient = !isProvider

  React.useEffect(() => {
    if (activeRole === "senior_requester") {
      if (!getSimpleMode()) {
        setSimpleMode(true)
      }
    }
  }, [activeRole])

  React.useEffect(() => {
    if (session && !authLoading) {
      const pending = getPendingRequestIntent()
      if (pending) {
        if (!isProvider) {
          setRequestPrefill(pending)
          clearPendingRequestIntent()
          setRequestModalOpen(true)
          toast.success("Welcome back! Resuming your service request.")
        } else {
          clearPendingRequestIntent()
        }
      }
    }
  }, [session, authLoading, isProvider])

  React.useEffect(() => {
    if (isProvider) {
      if (activeTab === "recipients") {
        setActiveTab("overview")
      }
    } else {
      if (activeTab === "wallet" || activeTab === "impact") {
        setActiveTab("overview")
      }
    }
  }, [isProvider, activeTab])

  const [myRequests, setMyRequests] = React.useState<AssistanceRequest[]>([])
  const [openRequests, setOpenRequests] = React.useState<AssistanceRequest[]>([])
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [recipients, setRecipients] = React.useState<CareRecipient[]>([])
  const [impactLedger, setImpactLedger] = React.useState<VolunteerImpactLedger[]>([])

  const [wallet, setWallet] = React.useState<CompanionWallet>(() => {
    const saved = localStorage.getItem("wanes_companion_wallet") || localStorage.getItem("nova_companion_wallet")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed.available_balance === "number") {
          return parsed
        }
      } catch {}
    }
    return {
      available_balance: 0,
      escrow_in_transit: 0,
      total_earned: 0,
      currency: "EGP",
    }
  })

  React.useEffect(() => {
    const serialized = JSON.stringify(wallet)
    localStorage.setItem("wanes_companion_wallet", serialized)
    localStorage.setItem("nova_companion_wallet", serialized)
  }, [wallet])

  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [withdrawAmount, setWithdrawAmount] = React.useState("500")
  const [withdrawMethod, setWithdrawMethod] = React.useState<"wallet" | "meeza" | "instapay">("wallet")
  const [withdrawDestination, setWithdrawDestination] = React.useState("010 2345 6789")
  const [withdrawLoading, setWithdrawLoading] = React.useState(false)

  const [dataLoading, setDataLoading] = React.useState(true)
  const [acceptLoading, setAcceptLoading] = React.useState<string | null>(null)

  const [careRecipientsOpen, setCareRecipientsOpen] = React.useState(false)
  const [requestModalOpen, setRequestModalOpen] = React.useState(false)
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [checkoutDraft, setCheckoutDraft] = React.useState<PendingVisitDraft | null>(null)
  const [sosModalOpen, setSosModalOpen] = React.useState(false)
  const [negotiationOpen, setNegotiationOpen] = React.useState(false)
  const [negotiationRequest, setNegotiationRequest] = React.useState<AssistanceRequest | null>(null)
  const [mapViewRequest, setMapViewRequest] = React.useState<AssistanceRequest | null>(null)
  const [, setNegotiationsVersion] = React.useState(0)
  const [requestPrefill, setRequestPrefill] = React.useState<{
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
    recipientName?: string
  } | null>(null)

  function handleOpenNegotiation(req: AssistanceRequest) {
    setNegotiationRequest(req)
    setNegotiationOpen(true)
  }

  function handleTermsAgreed(requestId: string, agreedPrice: number, agreedEscrow: number) {
    setMyRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, payout_amount: agreedPrice, escrow_amount: agreedEscrow }
          : r
      )
    )
    setOpenRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, payout_amount: agreedPrice, escrow_amount: agreedEscrow }
          : r
      )
    )
    setNegotiationsVersion((v) => v + 1)
  }

  const [requestFilter, setRequestFilter] = React.useState<string>("all")
  const [requestSearch, setRequestSearch] = React.useState("")

  const isMountedRef = React.useRef(true)
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    setRecipients(getStoredRecipients())
  }, [])

  React.useEffect(() => {
    if (!authLoading && !session) {
      navigate("signin")
    }
  }, [authLoading, session, navigate])

  const fetchData = React.useCallback(async () => {
    if (!session) return
    setDataLoading(true)
    const userId = session.user.id

    try {
      let dbList: AssistanceRequest[] = []
      try {
        const { data: dbRequests } = await supabase
          .from("assistance_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50)

        dbList = (dbRequests as AssistanceRequest[]) || []
      } catch (dbErr) {
        console.warn("Supabase fetch note, synchronizing with local store:", dbErr)
      }

      const mergedList = mergeWithSharedRequests(dbList)

      if (isMountedRef.current) {
        setOpenRequests(mergedList)
        setMyRequests(mergedList.filter((r) => r.requester_id === userId))
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (isMountedRef.current) {
        setNotifications((notifData as Notification[]) || [])
      }

      const { data: ledgerData } = await supabase
        .from("volunteer_impact_ledger")
        .select("*")
        .eq("volunteer_id", userId)
        .order("created_at", { ascending: false })

      if (isMountedRef.current && ledgerData) {
        setImpactLedger(ledgerData as VolunteerImpactLedger[])
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      if (isMountedRef.current) {
        setDataLoading(false)
      }
    }
  }, [session])

  React.useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [fetchData, session])

  const fetchDataRef = React.useRef(fetchData)
  fetchDataRef.current = fetchData

  React.useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id

    const channelName = `dashboard_${userId}_${Math.random().toString(36).substring(2, 7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assistance_requests" },
        () => {
          fetchDataRef.current()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          fetchDataRef.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  React.useEffect(() => {
    const unsubscribe = liveSync.subscribe((_event) => {
      fetchDataRef.current()
      setNegotiationsVersion((v) => v + 1)
    })

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SHARED_REQUESTS_KEY || e.key === "wanes_skip_verification" || e.key === "nova_skip_verification") {
        fetchDataRef.current()
      }
    }

    const handleSharedReqUpdate = () => {
      fetchDataRef.current()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("wanes:shared-requests-updated", handleSharedReqUpdate)
    window.addEventListener("nova:shared-requests-updated", handleSharedReqUpdate)

    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("wanes:shared-requests-updated", handleSharedReqUpdate)
      window.removeEventListener("nova:shared-requests-updated", handleSharedReqUpdate)
    }
  }, [])

  async function handleAcceptPaidTask(reqId: string) {
    if (!session) return

    const targetReq = openRequests.find((r) => r.id === reqId)
    const companionGender = profile?.gender || "male"
    const requesterGender = targetReq?.requester_gender

    const isEmergency = targetReq?.urgency === "critical" || targetReq?.category === "emergency_sos"
    if (!isEmergency && requesterGender && companionGender && companionGender !== requesterGender) {
      toast.info("Verified Client Visit: Accepted with client safety preferences confirmed.")
    }

    setAcceptLoading(reqId)
    try {
      updateSharedRequest(reqId, {
        assigned_volunteer_id: session.user.id,
        status: "matched",
      })

      try {
        await supabase
          .from("assistance_requests")
          .update({
            assigned_volunteer_id: session.user.id,
            status: "matched",
          })
          .eq("id", reqId)
      } catch (dbErr) {
        console.warn("Supabase update notice:", dbErr)
      }

      setOpenRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, status: "matched", assigned_volunteer_id: session.user.id } : r
        )
      )

      const escrowAmt =
        targetReq?.escrow_amount ||
        (targetReq?.payout_amount ? targetReq.payout_amount * 0.80 : 200)

      setWallet((prev) => ({
        ...prev,
        escrow_in_transit: Math.round((prev.escrow_in_transit + escrowAmt) * 10) / 10,
      }))

      if (targetReq?.requester_id && targetReq.requester_id !== session.user.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: targetReq.requester_id,
            type: "match",
            title: "Companion Visit Accepted",
            message: `${profile?.full_name || "A verified companion"} has accepted your visit "${targetReq.title}".`,
            is_read: false,
          })
        } catch {}
      }

      toast.success(`Paid visit accepted! ${escrowAmt} EGP held in Escrow in Transit.`)
    } catch {
      toast.error("Failed to accept task.")
    } finally {
      setAcceptLoading(null)
    }
  }

  async function handleCompletePaidTask(reqId: string) {
    if (!session) return

    const targetReq = openRequests.find((r) => r.id === reqId)
    try {
      updateSharedRequest(reqId, { status: "completed" })

      try {
        await supabase
          .from("assistance_requests")
          .update({ status: "completed" })
          .eq("id", reqId)
      } catch (dbErr) {
        console.warn("Supabase update notice:", dbErr)
      }

      setOpenRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "completed" } : r))
      )

      const escrowAmt =
        targetReq?.escrow_amount ||
        (targetReq?.payout_amount ? targetReq.payout_amount * 0.80 : 200)

      setWallet((prev) => ({
        ...prev,
        escrow_in_transit: Math.max(0, Math.round((prev.escrow_in_transit - escrowAmt) * 10) / 10),
        available_balance: Math.round((prev.available_balance + escrowAmt) * 10) / 10,
        total_earned: Math.round((prev.total_earned + escrowAmt) * 10) / 10,
      }))

      if (targetReq?.requester_id && targetReq.requester_id !== session.user.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: targetReq.requester_id,
            type: "impact",
            title: "Visit Completed & Confirmed",
            message: `Your companion visit "${targetReq.title}" has been signed off and completed.`,
            is_read: false,
          })
        } catch {}
      }

      toast.success(`🎉 Visit completed & signed off! ${escrowAmt} EGP released to your Available Balance.`)
    } catch {
      toast.error("Failed to complete task.")
    }
  }

  async function handleAcceptVolunteerTask(reqId: string) {
    if (!session) return

    const targetReq = openRequests.find((r) => r.id === reqId)
    const volunteerGender = profile?.gender || "male"
    const requesterGender = targetReq?.requester_gender

    const isEmergency = targetReq?.urgency === "critical" || targetReq?.category === "emergency_sos"
    if (!isEmergency && requesterGender && volunteerGender && volunteerGender !== requesterGender) {
      toast.info("Community Task Accepted: Neighbor service scheduled.")
    }

    setAcceptLoading(reqId)
    try {
      updateSharedRequest(reqId, {
        assigned_volunteer_id: session.user.id,
        status: "matched",
      })

      try {
        await supabase
          .from("assistance_requests")
          .update({
            assigned_volunteer_id: session.user.id,
            status: "matched",
          })
          .eq("id", reqId)
      } catch (dbErr) {
        console.warn("Supabase update notice:", dbErr)
      }

      setOpenRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, status: "matched", assigned_volunteer_id: session.user.id } : r
        )
      )

      if (targetReq?.requester_id && targetReq.requester_id !== session.user.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: targetReq.requester_id,
            type: "match",
            title: "Community Volunteer Matched",
            message: `${profile?.full_name || "A verified volunteer"} has accepted your task "${targetReq.title}".`,
            is_read: false,
          })
        } catch {}
      }

      toast.success("Community task accepted! Added to your volunteer schedule.")
    } catch {
      toast.error("Failed to accept task.")
    } finally {
      setAcceptLoading(null)
    }
  }

  async function handleCompleteVolunteerTask(reqId: string) {
    if (!session) return
    const targetReq = openRequests.find((r) => r.id === reqId)
    try {
      updateSharedRequest(reqId, { status: "completed" })

      try {
        await supabase.from("assistance_requests").update({ status: "completed" }).eq("id", reqId)
      } catch (dbErr) {
        console.warn("Supabase update notice:", dbErr)
      }

      setOpenRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "completed" } : r))
      )

      try {
        await supabase.from("volunteer_impact_ledger").insert({
          volunteer_id: session.user.id,
          request_id: reqId,
          hours_completed: 2,
          impact_points: 50,
          signed_off_by_requester: true,
        })
      } catch {}

      setImpactLedger((prev) => [
        {
          id: `local-ledger-${Date.now()}`,
          volunteer_id: session.user.id,
          request_id: reqId,
          hours_completed: 2,
          impact_points: 50,
          digital_badge: "Community Star",
          signed_off_by_requester: true,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      if (targetReq?.requester_id && targetReq.requester_id !== session.user.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: targetReq.requester_id,
            type: "impact",
            title: "Community Task Completed",
            message: `Your community task "${targetReq.title}" has been completed and verified.`,
            is_read: false,
          })
        } catch {}
      }

      liveSync.broadcast({
        type: "request_updated",
        requestId: reqId,
      })

      toast.success("Task completed! 50 impact points and 2 service hours awarded.")
    } catch {
      toast.error("Failed to complete task.")
    }
  }

  async function handleCancelRequest(reqId: string) {
    if (!session) return
    try {
      await supabase
        .from("assistance_requests")
        .update({ status: "cancelled" })
        .eq("id", reqId)
        .eq("requester_id", session.user.id)

      setMyRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "cancelled" } : r))
      )
      setOpenRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "cancelled" } : r))
      )

      liveSync.broadcast({
        type: "request_updated",
        requestId: reqId,
      })

      toast.info("Request has been cancelled.")
    } catch {
      toast.error("An error occurred while cancelling the request.")
    }
  }

  async function handleMarkNotificationRead(id: string) {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (e) {
      console.error(e)
    }
  }

  async function handleMarkAllRead() {
    if (!session) return
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success("All notifications marked as read.")
    } catch {
      toast.error("Failed to mark all as read.")
    }
  }

  function handleRequestVisitForRecipient(rec: CareRecipient) {
    setRequestPrefill({
      title: `Assistance Visit for ${rec.name}`,
      category: "senior_care",
      urgency: "normal",
      description: `Care visit scheduled for ${rec.name} (${rec.relationship}, age ${rec.age}). Health notes: ${rec.conditions || "None specified."}`,
      recipientName: rec.name,
    })
    setRequestModalOpen(true)
  }

  function handleProceedToPaymob(draft: {
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
    location_text: string
    latitude?: number | null
    longitude?: number | null
    care_recipient_name?: string | null
    amount: number
  }) {
    setCheckoutDraft({
      title: draft.title,
      category: draft.category,
      urgency: draft.urgency,
      description: draft.description,
      location_text: draft.location_text,
      latitude: draft.latitude,
      longitude: draft.longitude,
      care_recipient_name: draft.care_recipient_name,
      amount: draft.amount,
    })
    setCheckoutOpen(true)
  }

  function handleCheckoutSuccess(createdReq?: AssistanceRequest) {
    if (createdReq) {
      setMyRequests((prev) => [createdReq, ...prev])
      setOpenRequests((prev) => [createdReq, ...prev])
    }
    fetchData()
  }

  function handleConfirmWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(withdrawAmount)
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid withdrawal amount.")
      return
    }
    if (num > wallet.available_balance) {
      toast.error(`Amount exceeds available balance of ${wallet.available_balance} EGP.`)
      return
    }
    if (!withdrawDestination.trim()) {
      toast.error("Please enter your payout destination account or phone number.")
      return
    }

    setWithdrawLoading(true)
    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        available_balance: Math.max(0, Math.round((prev.available_balance - num) * 10) / 10),
      }))
      setWithdrawLoading(false)
      setWithdrawOpen(false)
      toast.success(
        `Withdrawal of ${num} EGP requested! Funds will arrive via ${withdrawMethod.toUpperCase()} shortly.`
      )
    }, 600)
  }

  if (authLoading || (dataLoading && !session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex size-12 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-[#94A3B8]">Loading your Care Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const availableHelperRequests = openRequests.filter((r) => {
    if (r.status === "completed" || r.status === "cancelled") return false
    if (r.status === "matched" || r.status === "in_progress") {
      return r.assigned_volunteer_id === session.user.id
    }
    return true
  })

  const currentRequestsList = isCompanion || isVolunteer ? availableHelperRequests : myRequests
  const activeRequestsCount = currentRequestsList.filter(
    (r) => r.status === "open" || r.status === "matched" || r.status === "in_progress"
  ).length
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length
  const criticalAlertsCount = currentRequestsList.filter(
    (r) => r.urgency === "critical" && (r.status === "open" || r.status === "matched")
  ).length

  const rawName =
    profile?.full_name ||
    session.user?.user_metadata?.full_name ||
    profile?.email?.split("@")[0] ||
    session.user?.email?.split("@")[0] ||
    "Family Caregiver"
  const userName = rawName.split(" ")[0] || rawName

  return (
    <div className="flex min-h-screen bg-[#0F172A] text-[#F8FAFC] selection:bg-[#3B82F6]/30 selection:text-[#F8FAFC]">
      <div className="hidden lg:block lg:w-72 lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadNotificationsCount={unreadNotificationsCount}
          activeRequestsCount={activeRequestsCount}
          recipientsCount={recipients.length}
          walletBalance={wallet.available_balance}
        />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-[#1E293B] border-white/[0.08] text-[#F8FAFC]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadNotificationsCount={unreadNotificationsCount}
            activeRequestsCount={activeRequestsCount}
            recipientsCount={recipients.length}
            walletBalance={wallet.available_balance}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 bg-[#0F172A]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0F172A]/90 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-[#94A3B8] hover:text-[#F8FAFC]"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#3B82F6] text-white font-bold">
                W
              </div>
              <span className="font-bold tracking-tight text-[#F8FAFC] hidden sm:inline">Wanes Care</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isClient ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#059669]/30 bg-[#059669]/10 px-3 py-1 text-xs font-semibold text-[#059669]">
                <ShieldCheck className="size-3.5 text-[#059669]" />
                <span>{isSenior ? "Senior Requester" : "Client Portal"}</span>
                <span className="text-[#059669]/70 font-normal hidden md:inline">· Escrow Protected</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-xs font-semibold text-[#3B82F6]">
                  {isCompanion ? (
                    <Coins className="size-3.5 text-[#3B82F6]" />
                  ) : (
                    <Award className="size-3.5 text-[#3B82F6]" />
                  )}
                  <span>{isCompanion ? "Provider Portal · Paid Companion" : "Provider Portal · Volunteer"}</span>
                </span>
                {isCompanion && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[#059669]/30 bg-[#059669]/10 px-2.5 py-0.5 text-xs font-bold text-[#059669]">
                    <Wallet className="size-3 text-[#059669]" />
                    {wallet.available_balance} EGP
                  </span>
                )}
              </div>
            )}

          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSosModalOpen(true)}
              className="h-8 border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#DC2626]/20 text-xs gap-1.5"
            >
              <ShieldAlert className="size-3.5" />
              SOS
            </Button>
            {isClient ? (
              <Button
                size="sm"
                onClick={() => {
                  setRequestPrefill(null)
                  setRequestModalOpen(true)
                }}
                className="h-8 bg-[#3B82F6] text-white hover:bg-[#2563EB] text-xs font-semibold gap-1 cursor-pointer"
              >
                <PlusCircle className="size-3.5" />
                <span className="hidden sm:inline">Request Visit</span>
                <span className="sm:hidden">Visit</span>
              </Button>
            ) : isCompanion ? (
              <Button
                size="sm"
                onClick={() => setWithdrawOpen(true)}
                className="h-8 bg-[#3B82F6] text-white hover:bg-[#2563EB] text-xs font-semibold gap-1 cursor-pointer"
              >
                <Wallet className="size-3.5" />
                <span>Withdraw</span>
              </Button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === "admin-verification" && profile?.role === "admin" && (
            <AdminVerificationDashboard />
          )}

          {activeTab === "overview" && (
            <div className="space-y-8">
              {isCompanion && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/[0.08] bg-[#1E293B] p-8 backdrop-blur-xl shadow-xl">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Badge className="bg-[#059669]/20 text-[#059669] border border-[#059669]/30 text-xs font-bold gap-1.5">
                          <Coins className="size-3.5 text-[#059669]" />
                          80% Companion Escrow Model
                        </Badge>
                        <span className="text-xs text-[#94A3B8]">· Verified Paid Companion</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                        Companion Earnings & Tasks Hub
                      </h1>
                      <p className="text-sm text-[#94A3B8]">
                        Accept paid visits, verify completion with clients, and withdraw earnings directly to your mobile wallet or Meeza card.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => setWithdrawOpen(true)}
                        className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-sm gap-2 rounded-xl shadow-lg shadow-[#3B82F6]/20 cursor-pointer"
                      >
                        <Wallet className="size-4" />
                        Withdraw Earnings
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <Card className="border border-[#059669]/30 bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                      <CardContent className="p-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
                            Available Balance
                          </span>
                          <div className="flex size-10 items-center justify-center rounded-xl bg-[#059669]/20 text-[#059669] border border-[#059669]/30">
                            <Wallet className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-[#F8FAFC]">
                            {wallet.available_balance} <span className="text-lg text-[#059669]">EGP</span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">Ready for instant withdrawal</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-[#059669]/30 bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                      <CardContent className="p-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
                            Escrow in Transit
                          </span>
                          <div className="flex size-10 items-center justify-center rounded-xl bg-[#059669]/20 text-[#059669] border border-[#059669]/30">
                            <ShieldCheck className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-[#F8FAFC]">
                            {wallet.escrow_in_transit} <span className="text-lg text-[#059669]">EGP</span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">Held safely until visit sign-off</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                      <CardContent className="p-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                            Lifetime Earned
                          </span>
                          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0F172A] text-[#94A3B8] border border-white/[0.08]">
                            <Coins className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-[#F8FAFC]">
                            {wallet.total_earned} <span className="text-lg text-[#94A3B8]">EGP</span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">Total completed visit revenue</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <DailyServicesCalculator
                    variant="dashboard"
                    onActionClick={() => {
                      const el = document.getElementById("available-tasks-feed")
                      if (el) el.scrollIntoView({ behavior: "smooth" })
                    }}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-4 text-xs text-blue-200 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#F8FAFC] text-sm">
                          Live Production Dispatch &amp; Safety Matching Active
                        </p>
                        <p className="text-[#94A3B8] text-xs mt-0.5">
                          Connected to real-time client assistance requests. 80% Escrow safety protection and live GPS navigation enabled.
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6] font-bold shrink-0"
                    >
                      Live Dispatch Active
                    </Badge>
                  </div>

                  <div id="available-tasks-feed" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#F8FAFC]">Available Paid Tasks Nearby</h3>
                        <p className="text-xs text-[#94A3B8]">
                          Click to accept tasks and lock the 80% escrow payout to your profile
                        </p>
                      </div>
                      <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                        {openRequests.filter((r) => r.status === "open").length} Tasks Available
                      </Badge>
                    </div>

                    {openRequests.filter((r) => r.status === "open").length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B] p-12 text-center space-y-3">
                        <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <Clock className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-[#F8FAFC]">No Open Paid Tasks Right Now</h4>
                          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                            There are currently no new open requests. When a client books a visit, it will actively appear here in real time.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {openRequests
                          .filter((r) => r.status === "open")
                          .map((req) => {
                            const isInstantTask = req.urgency === "critical"
                            return (
                              <div
                                key={req.id}
                                className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-4 hover:border-[#3B82F6]/30 transition-all shadow-xl flex flex-col justify-between"
                              >
                                <div className="space-y-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="flex size-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                                            {categoryIcons[req.category]}
                                          </span>
                                          <div>
                                            <h4 className="font-bold text-[#F8FAFC] text-base leading-tight">
                                              {req.title}
                                            </h4>
                                            <p className="text-xs text-[#94A3B8] mt-0.5">
                                              {req.care_recipient_name || req.requester_name || "Client"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                          <Badge className={`${isInstantTask ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-[#059669]/20 text-[#059669] border-[#059669]/30"} text-xs font-bold shrink-0 flex items-center gap-1`}>
                                            {isInstantTask ? <Zap className="size-3 fill-amber-300" /> : null}
                                            {isInstantTask ? "$25 Instant On-Demand" : "$10 Standard"}
                                          </Badge>
                                          <span className="text-[10px] text-[#94A3B8]">
                                            {req.payout_amount || (isInstantTask ? 625 : 250)} EGP
                                          </span>
                                        </div>
                                      </div>

                                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                                        {req.description}
                                      </p>

                                      <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-3 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[#94A3B8]">
                                            {isInstantTask ? "80% Instant Net Payout ($20.00):" : "80% Companion Net Payout ($8.00):"}
                                          </span>
                                          <span className="font-bold text-[#059669]">
                                            {isInstantTask ? "$20.00" : "$8.00"} ({req.escrow_amount || (isInstantTask ? 500 : 200)} EGP)
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-white/[0.06] pt-1">
                                          <span>20% Platform &amp; Safety Fee:</span>
                                          <span className="text-[#94A3B8]">{isInstantTask ? "$5.00 (125 EGP)" : "$2.00 (50 EGP)"}</span>
                                        </div>
                                      </div>

                                <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setMapViewRequest(req)}
                                    className="group/loc flex items-center gap-1.5 text-[#94A3B8] hover:text-[#3B82F6] font-medium cursor-pointer transition-colors truncate max-w-[190px]"
                                    title="Open Google Maps & GPS Route"
                                  >
                                    <MapPin className="size-3.5 text-[#3B82F6] group-hover/loc:scale-110 transition-transform shrink-0" />
                                    <span className="truncate">{req.location_text || "Cairo, Egypt"}</span>
                                    <span className="text-[10px] text-[#3B82F6]/80 underline underline-offset-2 shrink-0">Map</span>
                                  </button>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-[#94A3B8]" />
                                    {new Date(req.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {(() => {
                                const neg = getNegotiationForRequest(req.id)
                                const isAgreed = neg?.currentStatus === "agreed"
                                const isPending = neg?.currentStatus === "pending_client" || neg?.currentStatus === "pending_provider"
                                return (
                                  <div className="space-y-2 pt-1">
                                    {neg && (
                                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-[#0F172A] border border-white/[0.08]">
                                        <span className="text-[#94A3B8]">Negotiation Status:</span>
                                        <span className={`font-semibold ${
                                          isAgreed ? "text-[#059669]" : isPending ? "text-[#3B82F6]" : "text-[#94A3B8]"
                                        }`}>
                                          {isAgreed
                                            ? `✓ Agreed (${neg.agreedPrice} EGP)`
                                            : isPending
                                            ? `Offer in Review (${neg.currentPrice} EGP)`
                                            : "Standard Terms"}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                      <Button
                                        onClick={() => handleAcceptPaidTask(req.id)}
                                        disabled={acceptLoading === req.id}
                                        className={`flex-1 font-bold h-10 rounded-xl cursor-pointer text-xs ${
                                          isInstantTask
                                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                                            : "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                                        }`}
                                      >
                                        {acceptLoading === req.id ? (
                                          <Loader2 className="size-4 animate-spin" />
                                        ) : isInstantTask ? (
                                          <span className="flex items-center gap-1.5">
                                            <Zap className="size-3.5 fill-slate-950" />
                                            Accept Instant ($20 Escrow)
                                          </span>
                                        ) : (
                                          "Accept Standard ($8 Escrow)"
                                        )}
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOpenNegotiation(req)}
                                        className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] hover:text-white hover:border-[#3B82F6]/30 text-xs font-semibold h-10 px-3 rounded-xl gap-1.5 cursor-pointer shrink-0"
                                        title="Negotiate rate, schedule, or terms"
                                      >
                                        <MessageSquare className="size-3.5 text-[#3B82F6]" />
                                        <span className="hidden sm:inline">Negotiate</span>
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <h3 className="text-xl font-bold text-[#F8FAFC]">My Active Companion Visits</h3>
                    {openRequests.filter(
                      (r) =>
                        (r.status === "matched" || r.status === "in_progress") &&
                        r.assigned_volunteer_id === session.user.id
                    ).length === 0 ? (
                      <p className="text-xs text-[#94A3B8]">
                        You have no accepted visits currently in progress. Accept tasks above to begin earning.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {openRequests
                          .filter(
                            (r) =>
                              (r.status === "matched" || r.status === "in_progress") &&
                              r.assigned_volunteer_id === session.user.id
                          )
                          .map((req) => (
                            <div
                              key={req.id}
                              className="rounded-2xl border border-[#3B82F6]/30 bg-[#1E293B] p-5 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-[#F8FAFC] text-sm">{req.title}</h4>
                                <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                                  In Progress
                                </Badge>
                              </div>
                              <p className="text-xs text-[#94A3B8]">{req.description}</p>
                              <div className="flex items-center justify-between text-xs pt-1">
                                <button
                                  type="button"
                                  onClick={() => setMapViewRequest(req)}
                                  className="group/loc flex items-center gap-1.5 text-[#3B82F6] hover:text-[#3B82F6]/80 font-medium cursor-pointer transition-colors truncate max-w-[220px]"
                                  title="Open Google Maps & Turn-by-Turn GPS navigation"
                                >
                                  <MapPin className="size-3.5 text-[#3B82F6] shrink-0" />
                                  <span className="truncate">{req.location_text || "Client Location"}</span>
                                  <span className="text-[10px] text-[#3B82F6]/80 underline underline-offset-2 shrink-0">Navigate (Maps) →</span>
                                </button>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                                <span className="text-xs font-semibold text-[#059669]">
                                  Escrow: {req.escrow_amount || 200} EGP
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompletePaidTask(req.id)}
                                  className="bg-[#059669] text-white hover:bg-[#059669]/90 font-bold text-xs h-8 rounded-lg cursor-pointer"
                                >
                                  Mark Completed & Claim Escrow
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSenior && (
                <div className="space-y-8">
                  <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B] p-8 sm:p-10 backdrop-blur-xl shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-4 rounded-full bg-[#059669] animate-ping" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#3B82F6]">
                        Senior Safety Mode Active
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
                      Welcome, {userName}!
                    </h1>
                    <p className="text-base text-[#94A3B8] max-w-2xl leading-relaxed">
                      Your personalized care network is online. Tap any button below to connect with your companion or request immediate assistance.
                    </p>
                  </div>

                  <div
                    onClick={() => setSosModalOpen(true)}
                    className="cursor-pointer rounded-3xl border-2 border-[#EF4444] bg-[#EF4444]/10 p-8 sm:p-10 text-center shadow-2xl hover:bg-[#DC2626]/20 transition-all group backdrop-blur-xl"
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex size-24 items-center justify-center rounded-3xl bg-[#EF4444] text-white shadow-2xl shadow-[#EF4444]/40 group-hover:scale-110 transition-transform animate-pulse">
                        <ShieldAlert className="size-14" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8FAFC]">
                          EMERGENCY SOS
                        </h2>
                        <p className="text-sm text-[#EF4444]/90 mt-1">
                          Hold 3 seconds to alert your emergency contacts and closest vetted responders
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B] p-8 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <PhoneCall className="size-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#F8FAFC]">Call Assigned Companion</h3>
                        <p className="text-sm text-[#94A3B8]">
                          Direct phone connection with your assigned vetted caregiver.
                        </p>
                      </div>
                      <a
                        href="tel:01000000000"
                        className="flex items-center justify-center gap-2.5 h-14 rounded-2xl bg-[#3B82F6] text-white hover:bg-[#2563EB] font-extrabold text-base shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                      >
                        <Phone className="size-5" />
                        <span>Call Companion Now</span>
                      </a>
                    </div>

                    <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B] p-8 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <Calendar className="size-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#F8FAFC]">Today's Care Visit</h3>
                        <p className="text-sm text-[#94A3B8]">
                          Scheduled for 2:30 PM: Medication review and afternoon neighborhood walk.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setRequestPrefill({
                            title: "Immediate Senior Assistance Request",
                            category: "senior_care",
                            urgency: "high",
                            description: "Senior requester needs assistance at home.",
                          })
                          setRequestModalOpen(true)
                        }}
                        className="h-14 rounded-2xl bg-[#3B82F6] text-white hover:bg-[#2563EB] font-extrabold text-base shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                      >
                        Request New Visit
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold uppercase tracking-wider text-[#94A3B8]">
                      Quick Assistance Choices
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          title: "Groceries & Pharmacy",
                          category: "daily_errands" as RequestCategory,
                          icon: <ShoppingBag className="size-8 text-[#3B82F6]" />,
                          desc: "Pick up meds and food",
                        },
                        {
                          title: "Doctor & Clinic",
                          category: "senior_care" as RequestCategory,
                          icon: <Heart className="size-8 text-[#059669]" />,
                          desc: "Escort to appointments",
                        },
                        {
                          title: "Phone & Tech Setup",
                          category: "tech_setup" as RequestCategory,
                          icon: <Smartphone className="size-8 text-[#3B82F6]" />,
                          desc: "WhatsApp & device help",
                        },
                        {
                          title: "Social Tea & Reading",
                          category: "senior_care" as RequestCategory,
                          icon: <Sparkles className="size-8 text-[#3B82F6]" />,
                          desc: "Friendly social visit",
                        },
                      ].map((sc) => (
                        <button
                          key={sc.title}
                          onClick={() => {
                            setRequestPrefill({
                              title: sc.title,
                              category: sc.category,
                              urgency: "normal",
                              description: `Senior requested: ${sc.desc}`,
                            })
                            setRequestModalOpen(true)
                          }}
                          className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/[0.08] bg-[#1E293B] hover:border-[#3B82F6]/40 hover:bg-[#1E293B]/90 transition-all text-center space-y-3 cursor-pointer group shadow-lg"
                        >
                          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#0F172A] border border-white/[0.08] group-hover:scale-105 group-hover:border-[#3B82F6]/30 transition-transform">
                            {sc.icon}
                          </div>
                          <div>
                            <span className="text-lg font-bold text-[#F8FAFC] block">{sc.title}</span>
                            <span className="text-xs text-[#94A3B8]">{sc.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isVolunteer && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/[0.08] bg-[#1E293B] p-8 backdrop-blur-xl shadow-xl">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 text-xs font-bold gap-1.5">
                          <Award className="size-3.5 text-[#3B82F6]" />
                          Community Impact Network
                        </Badge>
                        <span className="text-xs text-[#94A3B8]">· Verified Volunteer</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                        Volunteer Service & Impact Hub
                      </h1>
                      <p className="text-sm text-[#94A3B8]">
                        Help seniors and neighbors in your community. Earn verified hours, badges, and recognition.
                      </p>
                    </div>

                    <Button
                      onClick={() => setActiveTab("requests")}
                      className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-sm gap-2 rounded-xl shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                    >
                      <Users className="size-4" />
                      Browse Community Tasks
                    </Button>
                  </div>

                  {(() => {
                    const totalImpactPoints = impactLedger.reduce((sum, item) => sum + (item.impact_points || 0), 0)
                    const totalServiceHours = impactLedger.reduce((sum, item) => sum + (item.hours_completed || 0), 0)
                    const totalCompletedTasks = impactLedger.length
                    const totalBadges = impactLedger.filter((item) => item.digital_badge).length

                    return (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                        <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                          <CardContent className="p-0 space-y-2">
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Impact Points</span>
                            <div className="text-3xl font-extrabold text-[#059669]">{totalImpactPoints} pts</div>
                            <p className="text-xs text-[#94A3B8]">Live verified total</p>
                          </CardContent>
                        </Card>

                        <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                          <CardContent className="p-0 space-y-2">
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Service Hours</span>
                            <div className="text-3xl font-extrabold text-[#3B82F6]">{totalServiceHours} hrs</div>
                            <p className="text-xs text-[#94A3B8]">Certified service ledger</p>
                          </CardContent>
                        </Card>

                        <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                          <CardContent className="p-0 space-y-2">
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Completed Tasks</span>
                            <div className="text-3xl font-extrabold text-[#059669]">{totalCompletedTasks}</div>
                            <p className="text-xs text-[#94A3B8]">Community tasks signed off</p>
                          </CardContent>
                        </Card>

                        <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                          <CardContent className="p-0 space-y-2">
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Digital Badges</span>
                            <div className="text-3xl font-extrabold text-[#3B82F6]">{totalBadges}</div>
                            <p className="text-xs text-[#94A3B8]">{totalBadges > 0 ? "Earned Badges" : "Complete visits to earn"}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()}

                  <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-4">
                    <h3 className="font-bold text-[#F8FAFC] text-base">Earned Digital Recognition</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { title: "Compassionate Neighbor", level: "Gold", icon: "🏅" },
                        { title: "Senior Care Ally", level: "Silver", icon: "🛡️" },
                        { title: "Verified Responder", level: "Active", icon: "⚡" },
                        { title: "Milestone Hours", level: "Bronze", icon: "🌟" },
                      ].map((b) => (
                        <div
                          key={b.title}
                          className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-3 text-center space-y-1"
                        >
                          <span className="text-2xl block">{b.icon}</span>
                          <p className="text-xs font-bold text-[#F8FAFC]">{b.title}</p>
                          <span className="text-[10px] text-[#3B82F6] font-semibold">{b.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#F8FAFC]">Community Tasks Available</h3>
                        <p className="text-xs text-[#94A3B8]">
                          Live community volunteer visits posted by nearby neighbors
                        </p>
                      </div>
                      <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                        {openRequests.filter((r) => r.status === "open").length} Tasks Available
                      </Badge>
                    </div>

                    {openRequests.filter((r) => r.status === "open").length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-12 text-center space-y-3">
                        <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <Users className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-[#F8FAFC]">No Open Community Tasks</h4>
                          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                            All neighbor requests in your area have been fulfilled. New volunteer opportunities will appear dynamically as neighbors post requests.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {openRequests
                          .filter((r) => r.status === "open")
                          .map((req) => (
                          <div
                            key={req.id}
                            className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-4 flex flex-col justify-between hover:border-[#3B82F6]/30 transition-all"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                                    {categoryIcons[req.category]}
                                  </span>
                                  <div>
                                    <h4 className="font-bold text-[#F8FAFC] text-base leading-tight">
                                      {req.title}
                                    </h4>
                                    <p className="text-xs text-[#94A3B8]">
                                      {req.care_recipient_name || req.requester_name || "Community Member"}
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 text-xs font-bold">
                                  50 pts
                                </Badge>
                              </div>

                              <p className="text-xs text-[#94A3B8] line-clamp-3 leading-relaxed">
                                {req.description}
                              </p>

                              <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
                                <button
                                  type="button"
                                  onClick={() => setMapViewRequest(req)}
                                  className="group/loc flex items-center gap-1.5 text-[#94A3B8] hover:text-[#3B82F6] font-medium cursor-pointer transition-colors truncate max-w-[190px]"
                                  title="Open Google Maps & GPS Route"
                                >
                                  <MapPin className="size-3.5 text-[#3B82F6] group-hover/loc:scale-110 transition-transform shrink-0" />
                                  <span className="truncate">{req.location_text || "Cairo, Egypt"}</span>
                                  <span className="text-[10px] text-[#3B82F6]/80 underline underline-offset-2 shrink-0">Map</span>
                                </button>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="size-3.5 text-[#94A3B8]" />
                                  2 Hours
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleAcceptVolunteerTask(req.id)}
                              disabled={acceptLoading === req.id}
                              className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold h-10 rounded-xl cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-colors"
                            >
                              {acceptLoading === req.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "Accept Volunteer Task"
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isFamily && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/[0.08] bg-[#1E293B] p-8 backdrop-blur-xl shadow-xl">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#059669]/30 bg-[#059669]/10 px-3 py-1 text-xs font-semibold text-[#059669]">
                          <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
                          Live Care Network
                        </span>
                        <span className="text-xs text-[#94A3B8]">· Paymob Escrow Protected</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                        Welcome back, <span className="text-[#3B82F6]">{userName}</span>
                      </h1>
                      <p className="text-sm text-[#94A3B8] font-normal">
                        Monitor active requests, manage family recipients, and track companion visits in real time.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-center">
                      <Button
                        variant="outline"
                        onClick={() => setCareRecipientsOpen(true)}
                        className="h-11 border-white/[0.08] bg-[#0F172A] px-4 text-[#F8FAFC] hover:bg-white/[0.08] hover:text-white text-xs sm:text-sm gap-2 rounded-xl"
                      >
                        <Users className="size-4 text-[#3B82F6]" />
                        <span>Loved Ones ({recipients.length})</span>
                      </Button>
                      <Button
                        onClick={() => {
                          setRequestPrefill(null)
                          setRequestModalOpen(true)
                        }}
                        className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-xs sm:text-sm shadow-lg shadow-[#3B82F6]/25 gap-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <PlusCircle className="size-4 text-white" />
                        Request a Visit
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card
                      onClick={() => setActiveTab("recipients")}
                      className="group cursor-pointer border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl rounded-2xl shadow-xl transition-all hover:border-[#3B82F6]/40 hover:-translate-y-0.5 flex flex-col justify-between min-h-[160px]"
                    >
                      <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                            Care Recipients
                          </span>
                          <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 group-hover:scale-105 transition-transform">
                            <Users className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                            {recipients.length}
                          </div>
                          <p className="mt-2 text-xs text-[#94A3B8] flex items-center justify-between">
                            <span>Loved ones registered</span>
                            <span className="text-[#3B82F6] font-semibold group-hover:translate-x-0.5 transition-transform">
                              Manage →
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      onClick={() => setActiveTab("requests")}
                      className="group cursor-pointer border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl rounded-2xl shadow-xl transition-all hover:border-[#3B82F6]/40 hover:-translate-y-0.5 flex flex-col justify-between min-h-[160px]"
                    >
                      <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                            Active Visits
                          </span>
                          <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 group-hover:scale-105 transition-transform">
                            <Calendar className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                            {activeRequestsCount}
                          </div>
                          <p className="mt-2 text-xs text-[#94A3B8] flex items-center justify-between">
                            <span>Scheduled visits</span>
                            <span className="text-[#3B82F6] font-semibold group-hover:translate-x-0.5 transition-transform">
                              Track →
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-[#059669]/30 bg-[#059669]/10 p-6 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col justify-between min-h-[160px]">
                      <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
                            80% Escrow Reserve
                          </span>
                          <div className="flex size-11 items-center justify-center rounded-xl bg-[#059669]/20 text-[#059669] border border-[#059669]/30">
                            <ShieldCheck className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                            400 <span className="text-sm text-[#059669]">EGP</span>
                          </div>
                          <p className="mt-2 text-xs text-[#94A3B8]">Locked safely until visit sign-off</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      onClick={() => setSosModalOpen(true)}
                      className={`group cursor-pointer p-6 backdrop-blur-xl rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[160px] ${
                        criticalAlertsCount > 0
                          ? "border border-[#EF4444]/50 bg-[#EF4444]/20 hover:border-[#EF4444]"
                          : "border border-white/[0.08] bg-[#1E293B] hover:border-[#059669]/40"
                      }`}
                    >
                      <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                            SOS Emergency
                          </span>
                          <div
                            className={`flex size-11 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform ${
                              criticalAlertsCount > 0
                                ? "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30 animate-pulse"
                                : "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
                            }`}
                          >
                            <ShieldAlert className="size-5" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                              {criticalAlertsCount}
                            </span>
                            <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-[10px] font-semibold">
                              All Safe
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-[#94A3B8] flex items-center justify-between">
                            <span>3-Second Guard</span>
                            <span className="text-[#EF4444] font-semibold group-hover:translate-x-0.5 transition-transform">
                              Center →
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#F8FAFC]">Loved Ones & Care Recipients</h3>
                        <p className="text-xs text-[#94A3B8]">
                          Click "Request Visit" to book a verified companion with Paymob Escrow
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCareRecipientsOpen(true)}
                        className="bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 text-xs rounded-xl"
                      >
                        + Add Recipient
                      </Button>
                    </div>

                    {recipients.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-8 text-center space-y-3">
                        <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <UserPlus className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#F8FAFC]">No Care Recipients Added</h4>
                          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                            Add loved ones to quickly schedule verified companion visits, record health notes, and arrange safe transportation.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setCareRecipientsOpen(true)}
                          className="bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                        >
                          + Add First Loved One
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipients.map((rec) => (
                          <div
                            key={rec.id}
                            className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-4 hover:border-[#3B82F6]/30 transition-all shadow-xl flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] font-bold border border-[#3B82F6]/20 text-base">
                                    {rec.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-[#F8FAFC] text-base leading-tight">{rec.name}</h4>
                                    <p className="text-xs text-[#94A3B8]">{rec.relationship} · {rec.age} yrs</p>
                                  </div>
                                </div>
                                <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-[10px]">
                                  Active
                                </Badge>
                              </div>

                              <p className="text-xs text-[#94A3B8] line-clamp-2">
                                {rec.conditions || "No special medical restrictions recorded."}
                              </p>

                              <div className="text-xs text-[#94A3B8] space-y-1">
                                <p className="flex items-center gap-1.5">
                                  <Phone className="size-3 text-[#94A3B8]" />
                                  {rec.emergency_phone}
                                </p>
                                {rec.address && (
                                  <p className="flex items-center gap-1.5 truncate">
                                    <MapPin className="size-3 text-[#94A3B8]" />
                                    {rec.address}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Button
                              onClick={() => handleRequestVisitForRecipient(rec)}
                              className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold text-xs h-9 rounded-xl cursor-pointer gap-1.5 shadow-md shadow-[#3B82F6]/20 transition-colors"
                            >
                              <CalendarPlus className="size-3.5" />
                              Request Visit (Paymob Escrow)
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const reqWithNeg = myRequests.find((r) => {
                      const neg = getNegotiationForRequest(r.id)
                      return neg && (neg.currentStatus === "pending_client" || neg.currentStatus === "pending_provider" || neg.currentStatus === "agreed")
                    }) || myRequests[0]

                    return (
                      <div className="rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-6 backdrop-blur-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                              <MessageSquare className="size-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#F8FAFC] text-base flex items-center gap-2">
                                <span>Service Terms &amp; Rate Discussions</span>
                                <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30 text-[10px]">
                                  Live Negotiation
                                </Badge>
                              </h3>
                              <p className="text-xs text-[#94A3B8]">
                                {reqWithNeg
                                  ? `Discuss terms and adjust rates directly with companions for "${reqWithNeg.title}".`
                                  : "Discuss and adjust terms directly with verified companions before finalizing visits."}
                              </p>
                            </div>
                          </div>
                          {reqWithNeg ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenNegotiation(reqWithNeg)}
                              className="bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer self-start sm:self-auto gap-1.5 transition-colors"
                            >
                              <Sparkles className="size-3.5 text-white" />
                              <span>Review Terms & Rate</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-[#94A3B8] self-start sm:self-auto">
                              No active discussions
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#F8FAFC]">Recent Visit Requests</h3>
                      <button
                        onClick={() => setActiveTab("requests")}
                        className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        View all ({myRequests.length}) →
                      </button>
                    </div>

                    {myRequests.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-8 text-center space-y-2">
                        <p className="text-sm font-bold text-[#F8FAFC]">No active visit requests</p>
                        <p className="text-xs text-[#94A3B8]">
                          Click "Request a Visit" above to book your first companion visit.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myRequests.slice(0, 3).map((req) => (
                          <div
                            key={req.id}
                            className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#F8FAFC] text-sm">{req.title}</span>
                                <Badge className={statusColors[req.status] || ""}>
                                  {req.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#94A3B8] line-clamp-1">{req.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-[#059669]">
                                80% Escrow: {req.escrow_amount || 200} EGP
                              </span>
                              {req.status === "open" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelRequest(req.id)}
                                  className="h-8 text-xs border-white/[0.08] text-[#94A3B8] hover:text-[#EF4444]"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "recipients" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                      Family Management
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                    Care Recipients &amp; Loved Ones
                  </h2>
                  <p className="text-sm text-[#94A3B8] mt-1">
                    Manage family profiles, medical notes, emergency contacts, and personalized visit schedules.
                  </p>
                </div>
                <Button
                  onClick={() => setCareRecipientsOpen(true)}
                  className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-sm gap-2 self-start sm:self-center rounded-xl shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                >
                  <UserPlus className="size-4" />
                  Add New Recipient
                </Button>
              </div>

              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-16 text-center space-y-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                    <UserPlus className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">No Care Recipients Added Yet</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm">
                    Add loved ones and family members to quickly book companion visits, record medical care notes, and arrange safe transportation.
                  </p>
                  <Button
                    onClick={() => setCareRecipientsOpen(true)}
                    className="bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold text-xs h-9 px-4 rounded-xl mt-2 cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-colors"
                  >
                    + Add Your First Loved One
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-7 backdrop-blur-xl space-y-5 hover:border-[#3B82F6]/30 transition-all shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-lg font-bold text-[#3B82F6]">
                              {rec.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-[#F8FAFC] text-lg">{rec.name}</h3>
                              <p className="text-xs text-[#94A3B8]">{rec.relationship} · {rec.age} years old</p>
                            </div>
                          </div>
                          <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-[10px] font-semibold">
                            Active
                          </Badge>
                        </div>

                        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-3.5 text-xs text-[#94A3B8] space-y-1.5">
                          <p className="font-semibold text-[#3B82F6]">Health &amp; Care Notes:</p>
                          <p className="text-[#94A3B8] leading-relaxed">
                            {rec.conditions || "No special health restrictions noted."}
                          </p>
                        </div>

                        <div className="space-y-2 text-xs text-[#94A3B8] pt-1">
                          <p className="flex items-center gap-2 text-[#F8FAFC]">
                            <span className="font-semibold text-[#3B82F6]">Emergency Phone:</span>
                            {rec.emergency_phone}
                          </p>
                          {rec.address && (
                            <p className="truncate flex items-center gap-2">
                              <MapPin className="size-3.5 text-[#94A3B8] shrink-0" />
                              {rec.address}
                            </p>
                          )}
                          {rec.preferred_schedule && (
                            <p className="flex items-center gap-2 text-[#3B82F6]">
                              <Calendar className="size-3.5 shrink-0" />
                              {rec.preferred_schedule}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
                        <Button
                          size="sm"
                          onClick={() => handleRequestVisitForRecipient(rec)}
                          className="flex-1 bg-[#3B82F6] text-white hover:bg-[#2563EB] text-xs font-bold gap-1.5 h-9 rounded-lg cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-colors"
                        >
                          <CalendarPlus className="size-3.5" />
                          Request Visit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCareRecipientsOpen(true)}
                          className="border-white/[0.08] bg-[#0F172A] text-xs text-[#94A3B8] hover:text-white hover:bg-white/[0.08] h-9 rounded-lg px-3 transition-colors"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                      Earnings &amp; Payouts
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                    Companion Wallet &amp; Escrow Ledger
                  </h2>
                  <p className="text-sm text-[#94A3B8] mt-1">
                    Track your available balance, in-transit escrow reserves, and submit payout withdrawals.
                  </p>
                </div>
                <Button
                  onClick={() => setWithdrawOpen(true)}
                  className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-sm gap-2 rounded-xl shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                >
                  <Wallet className="size-4" />
                  Withdraw Funds
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="border border-[#059669]/30 bg-[#059669]/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                  <CardContent className="p-0 space-y-2">
                    <span className="text-xs text-[#059669] font-bold uppercase">Available Balance</span>
                    <div className="text-4xl font-extrabold text-[#F8FAFC]">
                      {wallet.available_balance} <span className="text-lg text-[#059669]">EGP</span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">Ready to transfer to Meeza or Vodafone Cash</p>
                  </CardContent>
                </Card>

                <Card className="border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                  <CardContent className="p-0 space-y-2">
                    <span className="text-xs text-[#3B82F6] font-bold uppercase">Escrow in Transit</span>
                    <div className="text-4xl font-extrabold text-[#F8FAFC]">
                      {wallet.escrow_in_transit} <span className="text-lg text-[#3B82F6]">EGP</span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">Released once client signs off on visit</p>
                  </CardContent>
                </Card>

                <Card className="border border-white/[0.08] bg-[#1E293B] p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                  <CardContent className="p-0 space-y-2">
                    <span className="text-xs text-[#94A3B8] font-bold uppercase">Total Lifetime Earned</span>
                    <div className="text-4xl font-extrabold text-[#F8FAFC]">
                      {wallet.total_earned} <span className="text-lg text-[#94A3B8]">EGP</span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">80% net payout cumulative</p>
                  </CardContent>
                </Card>
              </div>

              <DailyServicesCalculator
                variant="dashboard"
                onActionClick={() => setActiveTab("overview")}
              />
            </div>
          )}

          {activeTab === "impact" && (
            <div className="space-y-8">
              <div className="border-b border-white/10 pb-6">
                <span className="rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                  Volunteer Verification
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-2">
                  Impact Ledger &amp; Service Badges
                </h2>
                <p className="text-sm text-[#94A3B8] mt-1">
                  Verified community service hours, impact points, and digital badges.
                </p>
              </div>

              {impactLedger.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-16 text-center space-y-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                    <Award className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">No Verified Impact Logged Yet</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm">
                    Complete your first community volunteer visit to record verified service hours, earn impact points, and receive digital community badges.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {impactLedger.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-5 flex items-center justify-between shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 font-bold">
                          <Award className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#F8FAFC] text-sm">{item.digital_badge || "Community Service"}</h4>
                          <p className="text-xs text-[#94A3B8]">
                            {item.hours_completed} Hours Completed · Signed off by Requester
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 font-bold">
                        +{item.impact_points} Points
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                      Task Directory
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                    {isCompanion
                      ? "Incoming Paid Orders & Tasks"
                      : isVolunteer
                      ? "Incoming Volunteer Community Tasks"
                      : "My Service Requests & Tracking"}
                  </h2>
                  <p className="text-sm text-[#94A3B8] mt-1">
                    {isCompanion || isVolunteer
                      ? "Filter and accept matching visits with strict same-gender safety compliance."
                      : "Track your requested visits, discuss and agree on negotiation terms, and confirm completions."}
                  </p>
                </div>
                {isClient && (
                  <Button
                    onClick={() => {
                      setRequestPrefill(null)
                      setRequestModalOpen(true)
                    }}
                    className="h-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold px-5 text-sm gap-2 rounded-xl shadow-lg shadow-[#3B82F6]/25 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="size-4" />
                    Post New Request
                  </Button>
                )}
              </div>

              {(isCompanion || isVolunteer) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-4 text-xs text-[#94A3B8] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/20 text-[#3B82F6]">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#F8FAFC] text-sm">
                        Live Service Requests &amp; Appointments Feed
                      </p>
                      <p className="text-[#94A3B8] text-xs mt-0.5">
                        Discover open client requests, negotiate terms in real time, and manage active visits seamlessly.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6] font-bold shrink-0"
                  >
                    Live Operations Active
                  </Badge>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    placeholder="Search tasks..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="pl-10 h-10 border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {["all", "open", "matched", "in_progress", "completed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setRequestFilter(st)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                        requestFilter === st
                          ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/25"
                          : "border border-white/[0.08] bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.08]"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {currentRequestsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-16 text-center">
                  <Calendar className="size-14 text-[#94A3B8] mb-3" />
                  <h3 className="text-lg font-bold text-[#F8FAFC]">No requests found</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mt-1 mb-5">
                    {isCompanion || isVolunteer
                      ? "No active requests match your filter. Check back soon!"
                      : "Post a visit request to get matched with vetted local companions."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {currentRequestsList
                    .filter((r) => (requestFilter === "all" ? true : r.status === requestFilter))
                    .filter((r) =>
                      requestSearch
                        ? r.title.toLowerCase().includes(requestSearch.toLowerCase()) ||
                          r.description.toLowerCase().includes(requestSearch.toLowerCase())
                        : true
                    )
                    .map((req) => (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-4 hover:border-[#3B82F6]/30 transition-all shadow-xl flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                              {categoryIcons[req.category]}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge className={statusColors[req.status] || ""} variant="secondary">
                                {req.status.replace(/_/g, " ")}
                              </Badge>
                              <Badge className={urgencyColors[req.urgency] || ""} variant="secondary">
                                {req.urgency}
                              </Badge>
                              {req.payout_amount && (
                                <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-[10px] font-bold">
                                  {req.payout_amount} EGP
                                </Badge>
                              )}
                              {req.requester_gender && (
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 font-semibold ${
                                    req.requester_gender === "male"
                                      ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]"
                                      : "border-pink-500/30 bg-pink-500/10 text-pink-300"
                                  }`}
                                >
                                  {req.requester_gender === "male" ? "Male" : "Female"}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-[#F8FAFC] text-base leading-snug">{req.title}</h3>
                          <p className="text-xs text-[#94A3B8] line-clamp-3 leading-relaxed">
                            {req.description}
                          </p>
                        </div>

                        <div className="space-y-3 border-t border-white/[0.08] pt-3.5">
                          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3.5 text-[#94A3B8]" />
                              {new Date(req.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {req.location_text && (
                              <button
                                type="button"
                                onClick={() => setMapViewRequest(req)}
                                className="group/loc flex items-center gap-1.5 text-[#94A3B8] hover:text-[#3B82F6] transition-colors cursor-pointer truncate max-w-[160px]"
                                title="View on Google Maps & directions"
                              >
                                <MapPin className="size-3.5 text-[#3B82F6]/70 group-hover/loc:text-[#3B82F6] shrink-0" />
                                <span className="truncate">{req.location_text}</span>
                              </button>
                            )}
                          </div>

                          {(() => {
                            const neg = getNegotiationForRequest(req.id)
                            const isAgreed = neg?.currentStatus === "agreed"
                            const isPending = neg?.currentStatus === "pending_client" || neg?.currentStatus === "pending_provider"
                            return (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenNegotiation(req)}
                                className={`w-full justify-between text-xs h-9 rounded-xl border transition-all cursor-pointer ${
                                  isAgreed
                                    ? "border-[#059669]/35 bg-[#059669]/10 text-[#059669] hover:bg-[#059669]/20"
                                    : isPending
                                    ? "border-[#3B82F6]/35 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20"
                                    : "border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:border-[#3B82F6]/30 hover:text-[#F8FAFC] hover:bg-white/[0.05]"
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <MessageSquare className="size-3.5 text-[#3B82F6] shrink-0" />
                                  <span className="truncate">
                                    {isAgreed
                                      ? `✓ Agreed Terms · ${neg?.agreedPrice} EGP`
                                      : isPending
                                      ? `Offer in Review · ${neg?.currentPrice} EGP`
                                      : "Discuss / Negotiate Terms"}
                                  </span>
                                </span>
                                <span className="text-[10px] text-[#3B82F6] font-bold shrink-0 ml-1">&rarr;</span>
                              </Button>
                            )
                          })()}

                          {isCompanion && req.status === "open" && (
                            <Button
                              onClick={() => handleAcceptPaidTask(req.id)}
                              disabled={acceptLoading === req.id}
                              className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] text-xs font-bold h-9 rounded-lg cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-colors"
                            >
                              {acceptLoading === req.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                `Accept Task (80% Escrow · ${req.escrow_amount || 200} EGP)`
                              )}
                            </Button>
                          )}

                          {isCompanion && (req.status === "matched" || req.status === "in_progress") && (
                            <Button
                              onClick={() => handleCompletePaidTask(req.id)}
                              className="w-full bg-[#059669] text-white hover:bg-[#059669]/90 text-xs font-bold h-9 rounded-lg cursor-pointer shadow-md shadow-[#059669]/20 transition-colors"
                            >
                              Mark Completed & Claim Escrow
                            </Button>
                          )}

                          {isVolunteer && req.status === "open" && (
                            <Button
                              onClick={() => handleAcceptVolunteerTask(req.id)}
                              disabled={acceptLoading === req.id}
                              className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] text-xs font-bold h-9 rounded-lg cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-colors"
                            >
                              {acceptLoading === req.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Accept Volunteer Task"
                              )}
                            </Button>
                          )}

                          {isVolunteer && (req.status === "matched" || req.status === "in_progress") && (
                            <Button
                              onClick={() => handleCompleteVolunteerTask(req.id)}
                              className="w-full bg-[#059669] text-white hover:bg-[#059669]/90 text-xs font-bold h-9 rounded-lg cursor-pointer shadow-md shadow-[#059669]/20 transition-colors"
                            >
                              Mark as Completed & Signed Off
                            </Button>
                          )}

                          {!isCompanion && !isVolunteer && (req.status === "open" || req.status === "matched") && (
                            <Button
                              variant="outline"
                              onClick={() => handleCancelRequest(req.id)}
                              className="w-full border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:text-[#EF4444] hover:border-[#EF4444]/30 text-xs h-9 rounded-lg transition-colors"
                            >
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sos" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-1 text-xs font-bold text-[#EF4444] self-center sm:self-start mb-1">
                  <ShieldAlert className="size-3.5" />
                  Emergency Rapid Response
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">Emergency SOS Center</h2>
                <p className="text-sm text-[#94A3B8]">
                  Instant safety broadcast to emergency contacts and vetted neighborhood responders.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-8 rounded-2xl border border-[#EF4444]/30 bg-[#1E293B] p-8 sm:p-12 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 shadow-2xl">
                  <div className="flex size-24 items-center justify-center rounded-3xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 shadow-lg shadow-[#EF4444]/20 animate-pulse">
                    <ShieldAlert className="size-12" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-2xl font-bold text-[#F8FAFC]">3-Second Protected Trigger</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Our safety guard requires a 3-second continuous hold to prevent accidental alerts while ensuring swift activation during real emergencies.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setSosModalOpen(true)}
                    className="h-12 bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-xl shadow-[#EF4444]/30 font-bold px-10 gap-2.5 text-sm rounded-xl cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="size-5" />
                    Open SOS Safety Trigger
                  </Button>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-2.5 shadow-xl">
                    <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-xs">
                      <Radio className="size-4" />
                      Live GPS Telemetry
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Coordinates are automatically packaged and transmitted directly to nearby responder devices.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 backdrop-blur-xl space-y-2.5 shadow-xl">
                    <div className="flex items-center gap-2 text-[#059669] font-bold text-xs">
                      <CheckCircle2 className="size-4" />
                      10s Cancel Grace Period
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      A 10-second countdown allows immediate cancellation in case of mistaken activation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                      Alert Feed
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">Notification Center</h2>
                  <p className="text-sm text-[#94A3B8] mt-1">
                    Real-time updates regarding volunteer matching, schedule changes, and safety alerts.
                  </p>
                </div>
                {unreadNotificationsCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllRead}
                    className="h-10 border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] self-start sm:self-center text-xs font-medium gap-2 rounded-xl transition-colors"
                  >
                    <CheckCircle2 className="size-4 text-[#059669]" />
                    Mark All as Read
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/40 p-16 text-center">
                  <Bell className="size-14 text-[#94A3B8] mb-3" />
                  <h3 className="text-lg font-bold text-[#F8FAFC]">No notifications yet</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
                    You'll be alerted as soon as a companion accepts a request or system notices arrive.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-5 backdrop-blur-xl transition-all flex items-start gap-4 ${
                        !n.is_read
                          ? "border-[#3B82F6]/30 bg-[#1E293B] shadow-lg shadow-[#3B82F6]/5"
                          : "border-white/[0.08] bg-[#1E293B]/60 opacity-80"
                      }`}
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] border border-white/[0.08]">
                        {notifTypeIcons[n.type] || <Bell className="size-5 text-[#3B82F6]" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#F8FAFC] text-sm">{n.title}</h4>
                            {!n.is_read && <span className="size-2 rounded-full bg-[#3B82F6]" />}
                          </div>
                          <span className="text-xs text-[#94A3B8]">
                            {new Date(n.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{n.message}</p>
                      </div>

                      {!n.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="size-8 text-[#94A3B8] hover:text-[#3B82F6] hover:bg-white/[0.08] shrink-0"
                          title="Mark read"
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CareRecipientsDialog
        open={careRecipientsOpen}
        onOpenChange={setCareRecipientsOpen}
        recipients={recipients}
        onRecipientsChange={setRecipients}
        onRequestVisitFor={handleRequestVisitForRecipient}
      />

      <SosSafetyModal
        open={sosModalOpen}
        onOpenChange={setSosModalOpen}
        onSosTriggered={() => fetchData()}
      />

      <RequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        prefillData={requestPrefill}
        onProceedToPaymob={handleProceedToPaymob}
      />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        initialPlan={{
          name: checkoutDraft ? checkoutDraft.title : "Companion Assistance Visit",
          amount: checkoutDraft?.amount || 250,
          currency: "EGP",
          isRecurring: false,
          description:
            checkoutDraft?.description ||
            "Verified companion visit with 80% Escrow safety protection",
        }}
        pendingVisit={checkoutDraft}
        onSuccess={handleCheckoutSuccess}
      />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="glass-card sm:max-w-md border-white/[0.08] bg-[#1E293B] text-[#F8FAFC] backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Wallet className="size-5 text-[#3B82F6]" />
              Withdraw Companion Earnings
            </DialogTitle>
            <DialogDescription className="text-xs text-[#94A3B8]">
              Transfer your earned companion balance directly to your Egyptian wallet, card, or Instapay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmWithdraw} className="space-y-4 pt-2">
            <div className="rounded-xl border border-[#059669]/30 bg-[#059669]/10 p-3.5 flex items-center justify-between">
              <span className="text-xs text-[#059669]">Available to Withdraw:</span>
              <span className="font-extrabold text-[#059669] text-base">
                {wallet.available_balance} EGP
              </span>
            </div>

            <Field>
              <FieldLabel className="text-xs text-[#94A3B8]">Withdrawal Amount (EGP) *</FieldLabel>
              <Input
                type="number"
                min="50"
                max={wallet.available_balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs text-[#94A3B8]">Payout Method</FieldLabel>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: "wallet", label: "Vodafone Cash" },
                    { id: "meeza", label: "Meeza Card" },
                    { id: "instapay", label: "Instapay" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawMethod(m.id)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                      withdrawMethod === m.id
                        ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#3B82F6]"
                        : "border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel className="text-xs text-[#94A3B8]">
                {withdrawMethod === "wallet"
                  ? "Wallet Mobile Phone Number *"
                  : withdrawMethod === "meeza"
                  ? "16-Digit Meeza Card Number *"
                  : "Instapay IPA (e.g. name@instapay) *"}
              </FieldLabel>
              <Input
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder={
                  withdrawMethod === "wallet"
                    ? "010 1234 5678"
                    : withdrawMethod === "meeza"
                    ? "5078 0000 0000 0000"
                    : "user@instapay"
                }
                className="border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
              />
            </Field>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-white/[0.08] bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/[0.08]"
                onClick={() => setWithdrawOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={withdrawLoading || wallet.available_balance <= 0}
                className="flex-1 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold shadow-md shadow-[#3B82F6]/20 transition-colors cursor-pointer"
              >
                {withdrawLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  `Confirm ${withdrawAmount} EGP`
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NegotiationModal
        open={negotiationOpen}
        onOpenChange={setNegotiationOpen}
        request={negotiationRequest}
        currentRole={isCompanion ? "provider" : "client"}
        currentUserName={profile?.full_name || userName || (isCompanion ? "Verified Companion" : "Client")}
        onTermsAgreed={handleTermsAgreed}
      />

      <MapViewDialog
        open={!!mapViewRequest}
        onOpenChange={(open) => !open && setMapViewRequest(null)}
        request={mapViewRequest}
      />
    </div>
  )
}
