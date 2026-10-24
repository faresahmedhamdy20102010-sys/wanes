import * as React from "react"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  GraduationCap,
  FileText,
  UserCheck,
  Camera,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ZoomIn,
  RotateCw,
  X,
  Lock,
  Bot,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  getAllHelperVerifications,
  updateHelperVerificationStatus,
  validateEgyptianNationalId,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_NAME,
  type HelperVerificationRecord,
  type VerificationDocumentStatus,
} from "@/lib/verification"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { AIVerificationCopilot } from "./ai-verification-copilot"

export function AdminVerificationDashboard() {
  const { profile, isMasterAdmin: authorizedAsMasterAdmin, becomeMasterAdmin, refreshProfile } = useAuth()
  const { navigate } = useRouter()

  const [applications, setApplications] = React.useState<HelperVerificationRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | VerificationDocumentStatus>("all")
  const [roleFilter, setRoleFilter] = React.useState<"all" | "volunteer" | "paid_companion">("all")

  const [selectedApp, setSelectedApp] = React.useState<HelperVerificationRecord | null>(null)
  const [activeDocTab, setActiveDocTab] = React.useState<
    "front" | "back" | "university" | "police" | "selfie"
  >("selfie")

  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectionPreset, setRejectionPreset] = React.useState(
    "Verification selfie photo is blurry or ID card text is not readable"
  )
  const [customRejectionReason, setCustomRejectionReason] = React.useState("")

  const [lightboxImage, setLightboxImage] = React.useState<{ url: string; title: string } | null>(
    null
  )
  const [lightboxZoom, setLightboxZoom] = React.useState(1)
  const [lightboxRotation, setLightboxRotation] = React.useState(0)

  const loadData = React.useCallback(() => {
    const data = getAllHelperVerifications()
    setApplications(data)
  }, [])

  React.useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener("wanes:verification-status-changed", handleSync)
    window.addEventListener("nova:verification-status-changed", handleSync)
    window.addEventListener("wanes:new-verification-submitted", handleSync)
    window.addEventListener("nova:new-verification-submitted", handleSync)
    return () => {
      window.removeEventListener("wanes:verification-status-changed", handleSync)
      window.removeEventListener("nova:verification-status-changed", handleSync)
      window.removeEventListener("wanes:new-verification-submitted", handleSync)
      window.removeEventListener("nova:new-verification-submitted", handleSync)
    }
  }, [loadData])

  const stats = React.useMemo(() => {
    const total = applications.length
    const pending = applications.filter((a) => a.verification.status === "pending").length
    const approved = applications.filter((a) => a.verification.status === "approved").length
    const rejected = applications.filter((a) => a.verification.status === "rejected").length
    const aiSafe = applications.filter(
      (a) => a.aiAnalysis?.recommendation === "SAFE_TO_APPROVE"
    ).length
    const aiFlagged = applications.filter(
      (a) => a.aiAnalysis?.recommendation === "FLAGGED_REVIEW_REQUIRED"
    ).length
    const aiCritical = applications.filter(
      (a) => a.aiAnalysis?.recommendation === "REJECT_RISK_DETECTED"
    ).length
    return { total, pending, approved, rejected, aiSafe, aiFlagged, aiCritical }
  }, [applications])

  const filteredApps = React.useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.verification.status !== statusFilter) return false
      if (roleFilter !== "all" && app.role !== roleFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = app.fullName.toLowerCase().includes(q)
        const matchEmail = app.email.toLowerCase().includes(q)
        const matchId = app.verification.nationalIdNumber.includes(q)
        const matchUni = (app.verification.universityName || "").toLowerCase().includes(q)
        return matchName || matchEmail || matchId || matchUni
      }
      return true
    })
  }, [applications, statusFilter, roleFilter, searchQuery])

  function handleApprove(record: HelperVerificationRecord) {
    const reviewer = profile?.full_name ? `Admin ${profile.full_name}` : MASTER_ADMIN_NAME
    const success = updateHelperVerificationStatus(
      record.userId,
      "approved",
      undefined,
      `${reviewer} (AI Copilot Signed)`
    )

    if (success) {
      toast.success(
        `Application approved for ${record.fullName}! Provider task access is now UNLOCKED.`
      )
      loadData()
      if (selectedApp?.userId === record.userId) {
        setSelectedApp({
          ...selectedApp,
          verification: { ...selectedApp.verification, status: "approved" },
        })
      }
      if (record.userId === profile?.id) {
        refreshProfile(true)
      }
    } else {
      toast.error("Failed to approve application")
    }
  }

  function handleRejectWithAI(record: HelperVerificationRecord, aiReason: string) {
    setSelectedApp(record)
    setCustomRejectionReason(aiReason)
    setRejectDialogOpen(true)
  }

  function handleConfirmReject() {
    if (!selectedApp) return
    const finalReason = customRejectionReason.trim() || rejectionPreset

    const success = updateHelperVerificationStatus(
      selectedApp.userId,
      "rejected",
      finalReason,
      profile?.full_name ? `Admin ${profile.full_name}` : "Admin SuperUser"
    )

    if (success) {
      toast.warning(`Application rejected for ${selectedApp.fullName}. Gatekeeper updated.`)
      setRejectDialogOpen(false)
      loadData()
      setSelectedApp({
        ...selectedApp,
        verification: {
          ...selectedApp.verification,
          status: "rejected",
          rejectionReason: finalReason,
        },
      })
      if (selectedApp.userId === profile?.id) {
        refreshProfile(true)
      }
    } else {
      toast.error("Failed to reject application")
    }
  }

  function handleResetToPending(record: HelperVerificationRecord) {
    updateHelperVerificationStatus(record.userId, "pending", undefined, "Admin Reset")
    toast.info(`Application for ${record.fullName} reset to Pending review.`)
    loadData()
    if (selectedApp?.userId === record.userId) {
      setSelectedApp({
        ...selectedApp,
        verification: {
          ...selectedApp.verification,
          status: "pending",
          rejectionReason: undefined,
        },
      })
    }
    if (record.userId === profile?.id) {
      refreshProfile(true)
    }
  }

  if (!authorizedAsMasterAdmin) {
    return (
      <div className="min-h-svh bg-[#0F172A] text-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-white/[0.08] bg-[#1E293B] p-8 shadow-2xl backdrop-blur-xl space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 shadow-lg shadow-[#3B82F6]/10">
            <Lock className="size-8" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 text-[11px] uppercase tracking-wider">
              Single Administrator Restricted Access
            </Badge>
            <h2 className="text-xl font-black text-[#F8FAFC]">
              Wanes Master eKYC Trust & Safety Portal
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              All real-world provider registrations and sensitive security documents are routed exclusively to the platform's Single Administrator (<span className="text-[#3B82F6] font-mono">{MASTER_ADMIN_EMAIL}</span>) for manual verification before public launch.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] p-4 text-xs text-left space-y-1.5">
            <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">Current Session:</span>
            <div className="flex items-center justify-between">
              <span className="text-[#F8FAFC] font-medium">{profile?.full_name || profile?.email || "Guest"}</span>
              <span className="text-[#EF4444] font-bold uppercase text-[10px]">{profile?.role || "Unauthenticated"}</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Unauthorized access blocked. You must be authenticated as the Single Administrator to inspect applicant National IDs, criminal records, and university proofs.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              size="lg"
              onClick={async () => {
                await becomeMasterAdmin()
                toast.success(`Authenticated as Single Administrator (${MASTER_ADMIN_EMAIL})`)
              }}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-[#3B82F6]/20 cursor-pointer"
            >
              <ShieldCheck className="size-4 mr-2" />
              Authenticate as Single Administrator ({MASTER_ADMIN_EMAIL})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("home")}
              className="w-full text-[#94A3B8] hover:text-[#F8FAFC] text-xs cursor-pointer"
            >
              Return to Public Portal
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#0F172A] text-[#F8FAFC] pb-20">
      <div className="border-b border-white/[0.08] bg-[#0F172A]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Dashboard</span>
            </button>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <h1 className="text-sm font-extrabold text-[#F8FAFC] leading-tight flex items-center gap-2">
                  <span>Wanes eKYC & Security Verification Portal</span>
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 text-[9px] font-bold">
                    Single Administrator Inbox
                  </Badge>
                </h1>
                <p className="text-[10px] text-[#94A3B8]">
                  Master Admin: <span className="text-[#3B82F6] font-mono">{MASTER_ADMIN_EMAIL}</span> • Incoming real-world submissions routed directly here
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadData()
                toast.success("Applications refreshed")
              }}
              className="border-white/[0.08] bg-[#1E293B] text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Sync
            </Button>

            <Button
              size="sm"
              onClick={() => navigate("verification")}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-[#3B82F6]/20 cursor-pointer"
            >
              <Lock className="size-3.5 mr-1" />
              Security Gatekeeper
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-white/[0.08] bg-[#1E293B] backdrop-blur-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#94A3B8]">Total Applicants</p>
                <p className="text-2xl font-black text-[#F8FAFC] mt-1">{stats.total}</p>
                <span className="text-[10px] text-[#94A3B8]">All Providers</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#0F172A] text-[#94A3B8] border border-white/[0.08]">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#3B82F6]/30 bg-[#1E293B] backdrop-blur-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3B82F6] animate-ping" />
                  <p className="text-xs font-bold text-[#3B82F6]">Pending Review</p>
                </div>
                <p className="text-2xl font-black text-[#3B82F6] mt-1">{stats.pending}</p>
                <span className="text-[10px] text-[#94A3B8]">Strictly Gatekept</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#059669]/30 bg-[#1E293B] backdrop-blur-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#059669]">Approved Providers</p>
                <p className="text-2xl font-black text-[#059669] mt-1">{stats.approved}</p>
                <span className="text-[10px] text-[#94A3B8]">Unlocked Task Access</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#059669]/20 text-[#059669] border border-[#059669]/40">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#EF4444]/30 bg-[#1E293B] backdrop-blur-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#EF4444]">Action Required</p>
                <p className="text-2xl font-black text-[#EF4444] mt-1">{stats.rejected}</p>
                <span className="text-[10px] text-[#94A3B8]">Rejected / Resubmit</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                <XCircle className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 shrink-0">
              <Bot className="size-5" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
                <span>AI-Powered eKYC Review Assistant Active</span>
                <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 text-[9px] uppercase tracking-wider">
                  Continuous Safety Audit
                </Badge>
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Automated analysis of 14-digit National ID checksums, civil birthdates, police records & anti-proxy selfies.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/[0.08] text-xs">
              <span className="size-2 rounded-full bg-[#059669]" />
              <span className="text-[#94A3B8] font-medium">Safe to Approve:</span>
              <span className="text-[#059669] font-black">{stats.aiSafe}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/[0.08] text-xs">
              <span className="size-2 rounded-full bg-[#3B82F6]" />
              <span className="text-[#94A3B8] font-medium">Flagged:</span>
              <span className="text-[#3B82F6] font-black">{stats.aiFlagged}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/[0.08] text-xs">
              <span className="size-2 rounded-full bg-[#EF4444]" />
              <span className="text-[#94A3B8] font-medium">High Risk:</span>
              <span className="text-[#EF4444] font-black">{stats.aiCritical}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
              <Input
                placeholder="Search by name, National ID, university..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#0F172A] border-white/[0.08] text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

              <div className="flex rounded-xl bg-[#0F172A] p-1 border border-white/[0.08] text-xs">
                {(["all", "pending", "approved", "rejected"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#3B82F6] text-white shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {st === "all" ? "All Status" : st}
                  </button>
                ))}
              </div>

              <div className="flex rounded-xl bg-[#0F172A] p-1 border border-white/[0.08] text-xs">
                {(["all", "volunteer", "paid_companion"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      roleFilter === r
                        ? "bg-[#3B82F6] text-white"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {r === "all"
                      ? "All Roles"
                      : r === "volunteer"
                      ? "Volunteers"
                      : "Paid Companions"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <span>Helper Applications Queue</span>
              <Badge className="bg-[#1E293B] text-[#94A3B8] border border-white/[0.08] text-xs">
                {filteredApps.length} Applicants
              </Badge>
            </h2>
            <span className="text-[11px] text-[#94A3B8]">
              Click any card to inspect all 5 uploaded documents & National ID
            </span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center text-[#94A3B8] space-y-3">
              <ShieldAlert className="size-10 mx-auto text-[#94A3B8]" />
              <p className="font-semibold text-[#F8FAFC]">No applications match your filter</p>
              <p className="text-xs text-[#94A3B8]">
                Try adjusting your search query or status filter to see other helper records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredApps.map((app) => {
                const isPending = app.verification.status === "pending"
                const isApproved = app.verification.status === "approved"
                const isRejected = app.verification.status === "rejected"
                const decoded =
                  app.verification.decodedId ||
                  validateEgyptianNationalId(app.verification.nationalIdNumber).info

                return (
                  <div
                    key={app.id}
                    className={`rounded-2xl border p-5 transition-all backdrop-blur-xl ${
                      isPending
                        ? "border-[#3B82F6]/40 bg-[#1E293B] hover:border-[#3B82F6] shadow-lg shadow-[#3B82F6]/5"
                        : isApproved
                        ? "border-[#059669]/30 bg-[#1E293B] hover:border-[#059669]/60"
                        : "border-[#EF4444]/30 bg-[#1E293B] hover:border-[#EF4444]/60"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <img
                          src={
                            app.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                              app.fullName
                            )}`
                          }
                          alt={app.fullName}
                          className="size-14 rounded-2xl object-cover border-2 border-white/[0.08] shrink-0 shadow-md"
                        />

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-[#F8FAFC] truncate">
                              {app.fullName}
                            </h3>

                            <Badge
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                app.role === "paid_companion"
                                  ? "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40"
                                  : "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                              }`}
                            >
                              {app.role === "paid_companion" ? "Paid Companion" : "Volunteer"}
                            </Badge>

                            {isPending && (
                              <Badge className="bg-[#3B82F6] text-white font-black text-[10px] flex items-center gap-1 shadow-sm">
                                <Clock className="size-3" />
                                PENDING ADMIN REVIEW
                              </Badge>
                            )}
                            {isApproved && (
                              <Badge className="bg-[#059669]/20 text-[#059669] border border-[#059669]/40 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                APPROVED & ACTIVE
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold text-[10px] flex items-center gap-1">
                                <XCircle className="size-3" />
                                ACTION REQUIRED
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#94A3B8]">
                            <span>{app.email}</span>
                            <span>•</span>
                            <span className="font-mono">{app.phone}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#3B82F6] font-semibold">
                              <GraduationCap className="size-3.5" />
                              {app.verification.universityName} (
                              {app.verification.studentIdNumber || "Student ID Verified"})
                            </span>
                          </div>

                          {isRejected && app.verification.rejectionReason && (
                            <div className="mt-2 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 p-2 rounded-lg flex items-start gap-1.5">
                              <AlertTriangle className="size-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                              <span>
                                <strong>Admin Flag:</strong> {app.verification.rejectionReason}
                              </span>
                            </div>
                          )}

                          {app.isRealSubmission && (
                            <div className="pt-1">
                              <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 text-[10px] font-black tracking-wide py-0.5 px-2.5 flex items-center gap-1.5 w-fit shadow-sm">
                                <Zap className="size-3 text-[#3B82F6] animate-pulse" />
                                <span>⚡ REAL-WORLD SUBMISSION (Direct to Single Admin)</span>
                              </Badge>
                            </div>
                          )}

                          <div className="pt-1">
                            <AIVerificationCopilot record={app} compact />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.08]">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app)
                            setActiveDocTab("selfie")
                          }}
                          className="border-white/[0.08] bg-[#0F172A] hover:bg-white/[0.04] text-[#F8FAFC] text-xs cursor-pointer"
                        >
                          <Eye className="size-3.5 mr-1 text-[#3B82F6]" />
                          Inspect 5 Documents
                        </Button>

                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(app)}
                              className="bg-[#059669] hover:bg-[#059669]/90 text-white font-bold text-xs cursor-pointer shadow-md shadow-[#059669]/20"
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Approve Account
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedApp(app)
                                setRejectDialogOpen(true)
                              }}
                              className="text-[#EF4444] hover:text-[#EF4444]/80 hover:bg-[#DC2626]/10 text-xs cursor-pointer"
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {isApproved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApp(app)
                              setRejectDialogOpen(true)
                            }}
                            className="text-xs text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#DC2626]/10"
                          >
                            Revoke Access
                          </Button>
                        )}

                        {isRejected && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(app)}
                            className="bg-[#059669] hover:bg-[#059669]/90 text-white font-bold text-xs"
                          >
                            Re-Approve After Fix
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResetToPending(app)}
                          title="Reset application status to pending"
                          className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] px-2"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-[#0F172A] p-2.5 border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-[#94A3B8] flex items-center justify-between">
                          <span>14-Digit National ID</span>
                          <span className="text-[#059669] font-bold font-mono">Luhn ✓</span>
                        </span>
                        <p className="font-mono font-black text-[#3B82F6] text-sm tracking-wider">
                          {decoded?.formattedId || app.verification.nationalIdNumber}
                        </p>
                        <span className="text-[10px] text-[#94A3B8] block truncate">
                          Check digit: {decoded?.actualCheckDigit} (Verified)
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#0F172A] p-2.5 border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                          <Calendar className="size-3 text-[#3B82F6]" />
                          Birthdate & Age
                        </span>
                        <p className="font-bold text-[#F8FAFC] text-xs">
                          {decoded?.birthDate || "Decoded"}
                        </p>
                        <span className="text-[11px] text-[#059669] font-bold">
                          {decoded?.age || app.verification.confirmedAge} years old (18+ Valid)
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#0F172A] p-2.5 border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                          <MapPin className="size-3 text-[#3B82F6]" />
                          Governorate Registry
                        </span>
                        <p className="font-bold text-[#F8FAFC] text-xs truncate">
                          {decoded?.governorateName || "Governorate"} (
                          {decoded?.governorateCode || "01"})
                        </p>
                        <span className="text-[11px] text-[#94A3B8] font-arabic truncate block">
                          {decoded?.governorateNameAr || "جمهورية مصر العربية"}
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#0F172A] p-2.5 border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                          <User className="size-3 text-[#3B82F6]" />
                          Gender & Security
                        </span>
                        <p className="font-bold text-[#F8FAFC] text-xs capitalize">
                          {decoded?.genderLabel || "Verified"} ({decoded?.genderLabelAr || "ذكر"})
                        </p>
                        <span
                          className={`text-[10px] font-bold block ${
                            isApproved
                              ? "text-[#059669]"
                              : isPending
                              ? "text-[#3B82F6]"
                              : "text-[#EF4444]"
                          }`}
                        >
                          {isApproved
                            ? "✓ Access Granted"
                            : isPending
                            ? "⏳ Blocked in Gatekeeper"
                            : "✗ Blocked (Fix Req)"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mr-1">
                        5 Security Proofs:
                      </span>

                      {[
                        {
                          key: "front" as const,
                          label: "ID Front",
                          url:
                            app.verification.nationalIdFrontImage ||
                            app.verification.nationalIdImage,
                        },
                        {
                          key: "back" as const,
                          label: "ID Back",
                          url: app.verification.nationalIdBackImage,
                        },
                        {
                          key: "university" as const,
                          label: "University ID",
                          url: app.verification.universityIdImage,
                        },
                        {
                          key: "police" as const,
                          label: "Police Clearance",
                          url: app.verification.policeRecordImage,
                        },
                        {
                          key: "selfie" as const,
                          label: "Selfie with ID",
                          url: app.verification.verificationSelfieImage,
                        },
                      ].map((doc) => (
                        <button
                          key={doc.key}
                          type="button"
                          onClick={() => {
                            setSelectedApp(app)
                            setActiveDocTab(doc.key)
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0F172A] hover:bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] transition-all cursor-pointer group"
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              doc.url ? "bg-[#059669]" : "bg-[#EF4444]"
                            }`}
                          />
                          <span className="group-hover:text-[#3B82F6] transition-colors">
                            {doc.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={(open: boolean) => !open && setSelectedApp(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/[0.08] bg-[#1E293B] p-6 text-[#F8FAFC] shadow-2xl backdrop-blur-xl">
            <DialogHeader className="border-b border-white/[0.08] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedApp.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        selectedApp.fullName
                      )}`
                    }
                    alt={selectedApp.fullName}
                    className="size-12 rounded-xl object-cover border border-white/[0.08] shrink-0"
                  />
                  <div>
                    <DialogTitle className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
                      <span>{selectedApp.fullName}</span>
                      <Badge
                        className={
                          selectedApp.verification.status === "approved"
                            ? "bg-[#059669]/20 text-[#059669] border border-[#059669]/30"
                            : selectedApp.verification.status === "rejected"
                            ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                            : "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30"
                        }
                      >
                        {selectedApp.verification.status.toUpperCase()}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#94A3B8]">
                      {selectedApp.email} • {selectedApp.phone} • Submitted:{" "}
                      {new Date(selectedApp.verification.submittedAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.verification.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selectedApp)}
                      className="bg-[#059669] hover:bg-[#059669]/90 text-white font-bold text-xs"
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Approve & Unlock
                    </Button>
                  )}
                  {selectedApp.verification.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRejectDialogOpen(true)}
                      className="text-[#EF4444] hover:text-[#EF4444]/80 hover:bg-[#DC2626]/10 text-xs"
                    >
                      <XCircle className="size-3.5 mr-1" />
                      Reject Application
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="pt-2">
              <AIVerificationCopilot
                record={selectedApp}
                onApproveWithAI={handleApprove}
                onRejectWithAI={handleRejectWithAI}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 rounded-xl bg-[#0F172A] p-1 border border-white/[0.08] text-xs">
                {[
                  {
                    key: "selfie" as const,
                    label: "Verification Selfie (Anti-Proxy)",
                    icon: Camera,
                  },
                  {
                    key: "front" as const,
                    label: "National ID (Front)",
                    icon: ShieldCheck,
                  },
                  {
                    key: "back" as const,
                    label: "National ID (Back)",
                    icon: ShieldCheck,
                  },
                  {
                    key: "university" as const,
                    label: "University Student ID",
                    icon: GraduationCap,
                  },
                  {
                    key: "police" as const,
                    label: "Police Record (Fish w Tashbih)",
                    icon: FileText,
                  },
                ].map((t) => {
                  const Icon = t.icon
                  const isActive = activeDocTab === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveDocTab(t.key)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#3B82F6] text-white shadow-sm"
                          : "text-[#94A3B8] hover:text-[#F8FAFC]"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate text-[11px]">{t.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0F172A] p-4 space-y-3">
                  {(() => {
                    let currentUrl: string | undefined
                    let currentLabel = ""
                    let docBadge = ""

                    if (activeDocTab === "selfie") {
                      currentUrl = selectedApp.verification.verificationSelfieImage
                      currentLabel = "Anti-Proxy Verification Selfie"
                      docBadge = "Mandatory Biometric Proxy Guard"
                    } else if (activeDocTab === "front") {
                      currentUrl =
                        selectedApp.verification.nationalIdFrontImage ||
                        selectedApp.verification.nationalIdImage
                      currentLabel = "Egyptian National ID (Front Image)"
                      docBadge = "Ministry of Interior Card"
                    } else if (activeDocTab === "back") {
                      currentUrl = selectedApp.verification.nationalIdBackImage
                      currentLabel = "Egyptian National ID (Reverse / Back Image)"
                      docBadge = "Civil Registry Hologram"
                    } else if (activeDocTab === "university") {
                      currentUrl = selectedApp.verification.universityIdImage
                      currentLabel = "University ID Card / Enrollment Certificate"
                      docBadge = selectedApp.verification.universityName
                    } else if (activeDocTab === "police") {
                      currentUrl = selectedApp.verification.policeRecordImage
                      currentLabel = "Criminal Clearance Certificate ('Fish w Tashbih')"
                      docBadge = `Issued: ${
                        selectedApp.verification.policeRecordIssueDate || "Recent"
                      }`
                    }

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#F8FAFC]">{currentLabel}</h4>
                            <span className="text-[11px] text-[#3B82F6]">{docBadge}</span>
                          </div>

                          {currentUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setLightboxImage({ url: currentUrl!, title: currentLabel })
                              }
                              className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                            >
                              <ZoomIn className="size-3.5 mr-1" />
                              Inspect High-Res Lightbox
                            </Button>
                          )}
                        </div>

                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#1E293B] border border-white/[0.08] flex items-center justify-center p-2">
                          {currentUrl ? (
                            <img
                              src={currentUrl}
                              alt={currentLabel}
                              className="max-h-full max-w-full object-contain rounded-lg cursor-pointer transition-transform hover:scale-102"
                              onClick={() =>
                                setLightboxImage({ url: currentUrl!, title: currentLabel })
                              }
                            />
                          ) : (
                            <div className="text-center text-[#94A3B8] space-y-2">
                              <AlertTriangle className="size-8 mx-auto text-[#3B82F6]" />
                              <p className="text-xs text-[#F8FAFC]">Document not uploaded yet</p>
                              <span className="text-[10px] text-[#94A3B8]">
                                This requirement was not provided by the applicant.
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-xs font-bold text-[#3B82F6] flex items-center gap-1.5">
                        <ShieldCheck className="size-4" />
                        Mathematical ID Breakdown
                      </span>
                      <Badge className="bg-[#059669]/20 text-[#059669] border border-[#059669]/40 text-[10px]">
                        Luhn Pass
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">
                          14-Digit Egyptian Number
                        </span>
                        <p className="font-mono font-black text-[#3B82F6] text-sm">
                          {selectedApp.verification.decodedId?.formattedId ||
                            selectedApp.verification.nationalIdNumber}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">Date of Birth</span>
                          <span className="font-bold text-[#F8FAFC]">
                            {selectedApp.verification.decodedId?.birthDate || "1999-04-12"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">Calculated Age</span>
                          <span className="font-bold text-[#059669]">
                            {selectedApp.verification.decodedId?.age ||
                              selectedApp.verification.confirmedAge}{" "}
                            Years Old
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">Governorate</span>
                          <span className="font-bold text-[#F8FAFC]">
                            {selectedApp.verification.decodedId?.governorateName || "Cairo"} (
                            {selectedApp.verification.decodedId?.governorateCode || "01"})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">Gender Code</span>
                          <span className="font-bold text-[#F8FAFC] capitalize">
                            {selectedApp.verification.decodedId?.genderLabel || "Female"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] p-4 space-y-2.5 text-xs">
                    <h5 className="font-bold text-[#F8FAFC] text-xs">Verification Checklist:</h5>
                    <ul className="space-y-1.5 text-[#94A3B8] text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                        <span className="text-[#F8FAFC]">Selfie face matches National ID photo</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                        <span className="text-[#F8FAFC]">National ID name matches student ID</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                        <span className="text-[#F8FAFC]">Police record stamped & within 90 days</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-[#059669] shrink-0" />
                        <span className="text-[#F8FAFC]">Luhn Mod-10 mathematical checksum valid</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/[0.08] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#94A3B8]">
                Current status:{" "}
                <strong className="text-[#F8FAFC] capitalize">
                  {selectedApp.verification.status}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApp(null)}
                  className="border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] text-xs"
                >
                  Close
                </Button>
                {selectedApp.verification.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedApp)}
                    className="bg-[#059669] hover:bg-[#059669]/90 text-white font-bold text-xs"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Approve Application
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rejectDialogOpen && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md border-[#EF4444]/30 bg-[#1E293B] p-6 text-[#F8FAFC] shadow-2xl backdrop-blur-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#EF4444]">
                <XCircle className="size-5" />
                <DialogTitle className="text-base font-bold text-[#F8FAFC]">
                  Reject & Request Resubmission
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#94A3B8]">
                Specify why this helper's documents failed verification. This note will appear on
                their gatekeeper screen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <label className="text-[#F8FAFC] font-semibold block">Select Preset Reason:</label>
              <select
                value={rejectionPreset}
                onChange={(e) => setRejectionPreset(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#0F172A] px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="Verification selfie photo is blurry or ID card text is not readable">
                  Verification selfie is blurry / ID unreadable
                </option>
                <option value="National ID card photos are obscured or cut off">
                  National ID card photos are obscured
                </option>
                <option value="Police clearance record is older than 3 months or missing stamp">
                  Police clearance record is older than 3 months
                </option>
                <option value="Selfie face does not match National ID photo">
                  Selfie face does not match National ID photo
                </option>
                <option value="University ID card expired or enrollment unverified">
                  University ID card expired or unverified
                </option>
                <option value="Other">Other Custom Reason</option>
              </select>

              <div className="space-y-1 pt-1">
                <label className="text-[#F8FAFC] font-semibold block">Custom Notes for Helper:</label>
                <textarea
                  rows={3}
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                  placeholder="Optional extra instructions for the applicant..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0F172A] p-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogOpen(false)}
                className="border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs"
              >
                <XCircle className="size-3.5 mr-1" />
                Confirm Rejection & Lock Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/95 backdrop-blur-md p-4"
          onClick={() => {
            setLightboxImage(null)
            setLightboxZoom(1)
            setLightboxRotation(0)
          }}
        >
          <div
            className="relative max-w-5xl w-full h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#1E293B] p-4 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#3B82F6]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">{lightboxImage.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLightboxZoom((z) => Math.min(z + 0.25, 3))}
                  className="h-7 px-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <ZoomIn className="size-3.5 mr-1" />
                  {Math.round(lightboxZoom * 100)}%
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                  className="h-7 px-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <RotateCw className="size-3.5 mr-1" />
                  Rotate
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setLightboxImage(null)
                    setLightboxZoom(1)
                    setLightboxRotation(0)
                  }}
                  className="size-7 text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
