import * as React from "react"
import { ShieldCheck, CheckCircle2, ArrowRight, UserCheck, Sparkles, Home } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type VerificationGatekeeperProps = {
  isModal?: boolean
  onClose?: () => void
  onVerificationSuccess?: () => void
  initialRoleType?: "provider" | "client"
}

export function VerificationGatekeeper({
  isModal = false,
  onClose,
  onVerificationSuccess,
}: VerificationGatekeeperProps) {
  const { user, profile } = useAuth()
  const { navigate } = useRouter()

  React.useEffect(() => {
    if (onVerificationSuccess) {
      onVerificationSuccess()
    }
  }, [onVerificationSuccess])

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Wanes Member"
  const userEmail = profile?.email || user?.email || "Connected Account"
  const userRole = profile?.role || "standard_requester"

  const roleLabel =
    userRole === "volunteer"
      ? "Volunteer Helper"
      : userRole === "paid_companion"
      ? "Professional Care Companion"
      : userRole === "admin"
      ? "Master Administrator"
      : "Care Client / Requester"

  const handleReturn = () => {
    if (onClose) {
      onClose()
    } else {
      navigate("dashboard")
    }
  }

  return (
    <div className={`w-full ${isModal ? "p-4" : "min-h-[85vh] py-12 px-4 flex items-center justify-center bg-muted/20"}`}>
      <Card className="max-w-xl mx-auto shadow-xl border-emerald-500/20 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-primary p-6 text-white text-center">
          <div className="mx-auto size-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs px-2.5 py-0.5">
              Verified Account
            </Badge>
            <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs px-2.5 py-0.5">
              Active Member
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Account Active &amp; Verified</h2>
          <p className="text-white/80 text-sm mt-1 max-w-md mx-auto">
            Your Wanes account is fully active with complete access to real-time care requests and provider operations.
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="rounded-xl border bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-500" /> Member Name
              </span>
              <span className="font-semibold">{displayName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Registered Email</span>
              <span className="font-mono text-xs">{userEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform Role</span>
              <Badge variant="secondary" className="capitalize">
                {roleLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Access Level</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Full Live Operations
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 text-xs space-y-1.5 text-emerald-900 dark:text-emerald-200">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="size-3.5 text-emerald-600" /> Live Services Active
            </div>
            <p>
              You can post real care requests, discover active live tasks, accept assignments, and receive instant status updates without review delays.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={handleReturn}
            >
              <Home className="mr-2 size-4" /> Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("services")}
            >
              Explore Services <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
