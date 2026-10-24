import * as React from "react"
import {
  Bell,
  CheckCircle2,
  Circle,
  HeartHandshake,
  ShieldAlert,
  UserCheck,
  Award,
  Info,
  Trash2,
  Loader2,
} from "lucide-react"
import { supabase, type Notification } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Navbar } from "@/components/sections/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const typeIcons: Record<string, React.ReactNode> = {
  match: <UserCheck className="size-5 text-[#3B82F6]" />,
  request: <HeartHandshake className="size-5 text-[#3B82F6]" />,
  sos: <ShieldAlert className="size-5 text-[#EF4444]" />,
  impact: <Award className="size-5 text-[#059669]" />,
  system: <Info className="size-5 text-[#94A3B8]" />,
}

const typeColors: Record<string, string> = {
  match: "bg-[#3B82F6]/10 border border-[#3B82F6]/20",
  request: "bg-[#3B82F6]/10 border border-[#3B82F6]/20",
  sos: "bg-[#EF4444]/10 border border-[#EF4444]/20",
  impact: "bg-[#059669]/10 border border-[#059669]/20",
  system: "bg-white/[0.04] border border-white/[0.08]",
}

export function NotificationsPage() {
  const { session, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)

  const isMountedRef = React.useRef(true)
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (!authLoading && !session) {
      navigate("signin")
    }
  }, [authLoading, session, navigate])

  const fetchNotifications = React.useCallback(async () => {
    if (!session) return
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error(error.message)
      } else if (isMountedRef.current) {
        setNotifications((data as Notification[]) || [])
      }
    } catch {
      console.error("Failed to fetch notifications")
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [session?.user?.id])

  React.useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session, fetchNotifications])

  const fetchRef = React.useRef(fetchNotifications)
  fetchRef.current = fetchNotifications

  React.useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id
    const channelName = `notifs_${userId}_${Math.random().toString(36).substring(2, 7)}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => fetchRef.current()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
      if (error) {
        console.error(error.message)
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
      }
    } catch {
      console.error("Failed to mark notification as read")
    }
  }

  async function markAllRead() {
    if (!session) return
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds)

      if (error) {
        console.error(error.message)
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        toast.success("All notifications marked as read.")
      }
    } catch {
      console.error("Failed to mark all as read")
    }
  }

  async function deleteNotification(id: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
      if (error) {
        console.error(error.message)
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch {
      console.error("Failed to delete notification")
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (authLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background pt-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-svh bg-background">
      <Navbar onOpenRequestModal={() => navigate("create-request")} onOpenVoiceAssistant={() => {}} />
      <div className="pt-20">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Bell className="size-4" />
                Notifications
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Your Notification Center
              </h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCircle2 className="size-4" />
                Mark All Read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card className="glass-card p-12 text-center bg-[#1E293B]/85 border-white/[0.08]">
              <Bell className="mx-auto mb-3 size-12 text-[#94A3B8]" />
              <p className="font-medium text-[#F8FAFC]">No notifications yet</p>
              <p className="text-sm text-[#94A3B8]">
                You'll see updates about your requests, companion matches, and system alerts here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`glass-card p-4 transition-all hover:border-[#3B82F6]/40 bg-[#1E293B]/85 border-white/[0.08] ${
                    !n.is_read ? "border-[#3B82F6]/40 bg-[#1E293B]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${typeColors[n.type] || "bg-white/[0.04]"}`}>
                      {typeIcons[n.type] || <Info className="size-5 text-[#94A3B8]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#F8FAFC]">{n.title}</p>
                        {!n.is_read && (
                          <span className="flex size-2 rounded-full bg-[#3B82F6]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-[#94A3B8]">{n.message}</p>
                      <p className="mt-1.5 text-xs text-[#94A3B8]/80">
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#3B82F6] hover:bg-[#3B82F6]/10"
                          onClick={() => markAsRead(n.id)}
                          aria-label="Mark as read"
                        >
                          <Circle className="size-3 fill-[#3B82F6]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#DC2626]/10"
                        onClick={() => deleteNotification(n.id)}
                        aria-label="Delete notification"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
