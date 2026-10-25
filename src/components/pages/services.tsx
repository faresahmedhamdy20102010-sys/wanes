import * as React from "react"
import {
  Heart,
  ShoppingBag,
  Smartphone,
  Accessibility,
  AlertCircle,
  Clock,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { supabase, type AssistanceRequest, type RequestCategory } from "@/lib/supabase"
import { Navbar } from "@/components/sections/navbar"
import { RequestModal } from "@/components/sections/request-modal"
import { MapViewDialog } from "@/components/location/map-view-dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { ShieldCheck } from "lucide-react"

type ServiceFilter = "all" | RequestCategory

const filters: { value: ServiceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "senior_care", label: "Senior Care" },
  { value: "daily_errands", label: "Daily Errands" },
  { value: "tech_setup", label: "Tech Guidance" },
  { value: "mobility_assistance", label: "Mobility" },
  { value: "emergency_sos", label: "Emergency SOS" },
]

const categoryIcons: Record<RequestCategory, React.ReactNode> = {
  senior_care: <Heart className="size-5" />,
  daily_errands: <ShoppingBag className="size-5" />,
  tech_setup: <Smartphone className="size-5" />,
  mobility_assistance: <Accessibility className="size-5" />,
  emergency_sos: <AlertCircle className="size-5" />,
}

const urgencyColors: Record<string, string> = {
  normal: "bg-white/[0.08] text-[#94A3B8] border border-white/[0.08]",
  high: "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30",
  critical: "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30",
}

const statusColors: Record<string, string> = {
  open: "bg-[#059669]/20 text-[#059669] border border-[#059669]/30",
  matched: "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30",
  in_progress: "bg-[#3B82F6]/25 text-[#3B82F6] border border-[#3B82F6]/40",
  completed: "bg-white/[0.08] text-[#94A3B8] border border-white/[0.08]",
  cancelled: "bg-white/[0.04] text-[#94A3B8] border border-white/[0.08]",
}

export function ServicesPage() {
  const { profile } = useAuth()
  const [filter, setFilter] = React.useState<ServiceFilter>("all")
  const [genderFilter, setGenderFilter] = React.useState<"all" | "male" | "female">("all")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [requests, setRequests] = React.useState<AssistanceRequest[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (profile?.gender) {
      setGenderFilter(profile.gender)
    }
  }, [profile?.gender])
  const [requestModalOpen, setRequestModalOpen] = React.useState(false)
  const [mapViewRequest, setMapViewRequest] = React.useState<AssistanceRequest | null>(null)

  const isMountedRef = React.useRef(true)
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const fetchRequests = React.useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("assistance_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24)

      if (filter !== "all") {
        query = query.eq("category", filter)
      }
      if (genderFilter !== "all") {
        query = query.eq("requester_gender", genderFilter)
      }
      if (debouncedSearch.trim()) {
        query = query.ilike("title", `%${debouncedSearch.trim()}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error(error.message)
        if (isMountedRef.current) setRequests([])
      } else if (isMountedRef.current) {
        setRequests((data as AssistanceRequest[]) || [])
      }
    } catch {
      if (isMountedRef.current) setRequests([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [filter, genderFilter, debouncedSearch])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const fetchRef = React.useRef(fetchRequests)
  fetchRef.current = fetchRequests

  React.useEffect(() => {
    const channelName = `services_page_${Math.random().toString(36).substring(2, 7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assistance_requests" },
        () => fetchRef.current()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <Navbar
        onOpenRequestModal={() => setRequestModalOpen(true)}
        onOpenVoiceAssistant={() => {}}
      />
      <div className="pt-20">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:py-20 lg:py-24 sm:px-6 lg:px-8">
          <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              Services Directory
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Browse Community Requests
            </h1>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto text-balance">
              Filter by category, search by keyword, and post your own request instantly.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-white/[0.08] bg-[#1E293B]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
              />
            </div>
            <Button onClick={() => setRequestModalOpen(true)} className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-semibold gap-1.5 shadow-sm">
              <SlidersHorizontal className="size-4" />
              Post a Request
            </Button>
          </div>

          <div className="mb-4 flex justify-center">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as ServiceFilter)}>
              <TabsList className="flex flex-wrap gap-1 border-white/[0.08] bg-[#1E293B]/80">
                {filters.map((f) => (
                  <TabsTrigger key={f.value} value={f.value} className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white text-[#94A3B8]">
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium">
              <ShieldCheck className="size-4 text-[#3B82F6]" />
              <span>Same-Gender Safety Rule:</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B]/80 p-1">
              <button
                type="button"
                onClick={() => setGenderFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderFilter === "all"
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                All Genders
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter("male")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderFilter === "male"
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                Male Only
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter("female")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderFilter === "female"
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                Female Only
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="glass-card h-48 animate-pulse bg-[#1E293B]/85 border-white/[0.08]" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/[0.08] bg-[#1E293B]/50 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.04]">
                <Heart className="size-6 text-[#94A3B8]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#F8FAFC]">No requests found</h3>
                <p className="text-sm text-[#94A3B8]">
                  Try a different filter or be the first to post.
                </p>
              </div>
              <Button onClick={() => setRequestModalOpen(true)} className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 font-semibold">Post a Request</Button>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-8 lg:gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((req) => (
                <Card
                  key={req.id}
                  className="glass-card group cursor-pointer p-6 sm:p-7 transition-all hover:border-[#3B82F6]/40 hover:shadow-lg bg-[#1E293B]/85 border-white/[0.08]"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                      {categoryIcons[req.category]}
                    </div>
                    <Badge className={urgencyColors[req.urgency] || ""} variant="secondary">
                      {req.urgency}
                    </Badge>
                  </div>
                  <h3 className="mb-1.5 font-semibold leading-tight text-[#F8FAFC]">{req.title}</h3>
                  <p className="mb-4 line-clamp-2 text-sm text-[#94A3B8]">
                    {req.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {req.location_text && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMapViewRequest(req)
                        }}
                        className="flex items-center gap-1.5 hover:text-[#3B82F6] cursor-pointer transition-colors"
                        title="View on Google Maps"
                      >
                        <MapPin className="size-3.5 text-[#3B82F6]" />
                        <span>{req.location_text}</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge className={statusColors[req.status] || ""} variant="secondary">
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                    {req.requester_gender && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]"
                      >
                        {req.requester_gender === "male" ? "Male Only" : "Female Only"}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <RequestModal open={requestModalOpen} onOpenChange={setRequestModalOpen} prefillData={null} />
      <MapViewDialog
        open={!!mapViewRequest}
        onOpenChange={(open) => !open && setMapViewRequest(null)}
        request={mapViewRequest}
      />
    </div>
  )
}
