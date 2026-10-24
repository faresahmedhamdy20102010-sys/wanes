import * as React from "react"
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  CalendarClock,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Home,
  LogOut,
  ChevronRight,
  Settings,
  Coins,
  Award,
} from "lucide-react"
import { SimpleModeButton } from "@/components/accessibility/simple-mode-button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Badge } from "@/components/ui/badge"
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
import { ProfileSettingsDialog } from "./profile-settings-dialog"

export type DashboardTab =
  | "overview"
  | "recipients"
  | "requests"
  | "wallet"
  | "impact"
  | "sos"
  | "notifications"
  | "admin-verification"

type DashboardSidebarProps = {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  unreadNotificationsCount: number
  activeRequestsCount: number
  recipientsCount: number
  walletBalance?: number
  onCloseMobile?: () => void
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  unreadNotificationsCount,
  activeRequestsCount,
  recipientsCount,
  walletBalance = 0,
  onCloseMobile,
}: DashboardSidebarProps) {
  const { session, profile, signOut, isVerified } = useAuth()
  const { navigate } = useRouter()
  const [profileSettingsOpen, setProfileSettingsOpen] = React.useState(false)

  const role = profile?.role || "standard_requester"

  const navItems = React.useMemo(() => {
    const items: {
      id: DashboardTab
      label: string
      description: string
      icon: any
      badge: string | null
      badgeVariant?: "default" | "destructive" | "amber" | "outline"
    }[] = [
      {
        id: "overview",
        label: "Overview",
        description: "Main dashboard hub",
        icon: LayoutDashboard,
        badge: null,
      },
    ]

    const isClientRole = role === "standard_requester" || role === "senior_requester"
    const isPaidCompanion = role === "paid_companion"
    const isVolunteer = role === "volunteer"

    if (isClientRole) {
      items.push({
        id: "requests",
        label: "My Requests & Tracking",
        description: "Live visits & negotiations",
        icon: CalendarClock,
        badge: activeRequestsCount > 0 ? `${activeRequestsCount}` : null,
        badgeVariant: "default",
      })
      if (role === "standard_requester") {
        items.push({
          id: "recipients",
          label: "Care Recipients",
          description: "Loved ones & family directory",
          icon: Users,
          badge: recipientsCount > 0 ? `${recipientsCount}` : null,
          badgeVariant: "default",
        })
      }
    } else if (isPaidCompanion) {
      items.push(
        {
          id: "requests",
          label: "Incoming Orders & Tasks",
          description: "Available orders & active jobs",
          icon: CalendarClock,
          badge: activeRequestsCount > 0 ? `${activeRequestsCount}` : null,
          badgeVariant: "default",
        },
        {
          id: "wallet",
          label: "Earnings & Escrow",
          description: "Wallet & 80% Escrow payouts",
          icon: Coins,
          badge: walletBalance > 0 ? `${walletBalance} EGP` : "80% Escrow",
          badgeVariant: "amber",
        }
      )
    } else if (isVolunteer) {
      items.push(
        {
          id: "requests",
          label: "Incoming Community Tasks",
          description: "Nearby community tasks",
          icon: CalendarClock,
          badge: activeRequestsCount > 0 ? `${activeRequestsCount}` : null,
          badgeVariant: "default",
        },
        {
          id: "impact",
          label: "Impact Ledger",
          description: "Verified hours & badges",
          icon: Award,
          badge: null,
        }
      )
    }

    items.push(
      {
        id: "sos",
        label: "SOS Emergency",
        description: "Safety center & protection",
        icon: ShieldAlert,
        badge: "3s Guard",
        badgeVariant: "destructive",
      },
      {
        id: "notifications",
        label: "Notifications",
        description: "Alerts & matches",
        icon: Bell,
        badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : null,
        badgeVariant: "amber",
      }
    )

    if (role === "admin") {
      items.push({
        id: "admin-verification",
        label: "Admin Review Queue",
        description: "Security screening",
        icon: ShieldCheck,
        badge: "Admin",
        badgeVariant: "amber",
      })
    }

    return items
  }, [role, recipientsCount, activeRequestsCount, unreadNotificationsCount, walletBalance])

  const rawName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    profile?.email?.split("@")[0] ||
    session?.user?.email?.split("@")[0] ||
    "Family Caregiver"

  const userName = rawName.trim() || "Family Caregiver"
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  const userEmail = profile?.email || session?.user?.email || ""

  const roleLabels: Record<string, string> = {
    standard_requester: "Request Aid (Client)",
    senior_requester: "Senior Requester",
    paid_companion: "Paid Companion",
    volunteer: "Volunteer",
    admin: "Administrator",
  }
  const formattedRole = roleLabels[role] || "Member"

    return (
    <aside className="flex h-full w-full flex-col justify-between border-r border-white/[0.08] bg-[#0F172A] p-6 text-[#F8FAFC] select-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={() => {
              navigate("home")
              onCloseMobile?.()
            }}
            className="flex items-center gap-3.5 text-left transition-opacity hover:opacity-90 group cursor-pointer"
          >
            <div className="relative flex size-11 items-center justify-center rounded-2xl bg-[#3B82F6] border border-[#06B6D4]/30 text-white shadow-lg shadow-[#3B82F6]/25 group-hover:scale-105 transition-transform font-bold">
              <HeartHandshake className="size-6 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#059669] border-2 border-[#0F172A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#F8FAFC]">Wanes</span>
                <span className="rounded-md bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-bold text-[#06B6D4] border border-[#06B6D4]/30">
                  CARE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium">Community Platform</p>
            </div>
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B]/85 p-4 backdrop-blur-xl shadow-md">
          <div className="flex items-start gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/15 border border-[#06B6D4]/30 text-sm font-bold text-[#06B6D4] shadow-inner overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={userName}
                  className="size-full object-cover"
                />
              ) : (
                userInitials
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3.5 bg-[#059669] border-2 border-[#1E293B]"></span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-sm font-bold text-[#F8FAFC] leading-tight">
                  {userName}
                </p>
                <button
                  type="button"
                  onClick={() => setProfileSettingsOpen(true)}
                  className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
                  title="Profile Settings"
                >
                  <Settings className="size-3.5" />
                </button>
              </div>
              {userEmail && (
                <p className="truncate text-[11px] text-[#94A3B8] font-normal">
                  {userEmail}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-[#06B6D4]/30 bg-[#3B82F6]/10 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-[#06B6D4]"
                >
                  {formattedRole}
                </Badge>
                {profile?.gender && (
                  <Badge
                    variant="outline"
                    className="border-[#06B6D4]/30 bg-[#3B82F6]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#06B6D4]"
                  >
                    {profile.gender === "male" ? "Male" : "Female"}
                  </Badge>
                )}
                {profile?.age && (
                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    {profile.age}y
                  </span>
                )}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#059669]/30 bg-[#059669]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#059669]">
                    <ShieldCheck className="size-2.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#06B6D4]/30 bg-[#3B82F6]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#06B6D4]">
                    <ShieldAlert className="size-2.5" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-white/[0.08] pt-2.5">
            <SimpleModeButton variant="sidebar" />
          </div>
        </div>

        <nav className="space-y-1.5">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]/70">
            Navigation Menu
          </p>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  onCloseMobile?.()
                }}
                className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#3B82F6]/15 text-white font-semibold border border-[#06B6D4]/40 shadow-sm"
                    : "text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC] border border-transparent"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#3B82F6]" />
                )}

                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-[#3B82F6] border border-[#06B6D4]/30 text-white font-bold shadow-md shadow-[#3B82F6]/25"
                        : "bg-white/5 text-[#94A3B8] group-hover:text-[#06B6D4] group-hover:bg-[#3B82F6]/10"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className={`truncate text-sm ${isActive ? "text-[#F8FAFC] font-semibold" : "font-medium"}`}>
                      {item.label}
                    </p>
                  </div>
                </div>

                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={`ml-2 px-2 py-0.5 text-[10px] font-bold shrink-0 rounded-md ${
                      item.badgeVariant === "destructive"
                        ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                        : item.badgeVariant === "amber"
                        ? "bg-[#3B82F6]/20 text-[#06B6D4] border border-[#06B6D4]/30"
                        : "bg-white/10 text-[#F8FAFC] border border-white/10"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-6 border-t border-white/[0.08]">
        <button
          onClick={() => {
            navigate("home")
            onCloseMobile?.()
          }}
          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <Home className="size-4 text-[#94A3B8]" />
            Back to Home
          </span>
          <ChevronRight className="size-3.5 opacity-40" />
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors cursor-pointer">
              <span className="flex items-center gap-3">
                <LogOut className="size-4" />
                Sign Out
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/[0.08] bg-[#1E293B] text-[#F8FAFC]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#F8FAFC] text-lg font-bold">Sign out of Wanes?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#94A3B8] text-sm">
                You will need to sign in again to access your care dashboard and family requests.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel className="border-white/[0.08] bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await signOut()
                  navigate("home")
                }}
                className="bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ProfileSettingsDialog
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
      />
    </aside>
  )
}
