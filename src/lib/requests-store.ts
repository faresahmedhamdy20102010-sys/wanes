
import type { AssistanceRequest, RequestCategory, RequestUrgency, Gender } from "./supabase"
import { liveSync } from "./live-sync"

export const SHARED_REQUESTS_KEY = "wanes_shared_requests"
export const LEGACY_SHARED_REQUESTS_KEY = "nova_shared_requests"

function sanitizeRealRequests(requests: AssistanceRequest[]): AssistanceRequest[] {
  return requests.filter((r) => {
    if (!r || !r.id) return false
    if (r.id.startsWith("req_seed_")) return false
    if (r.requester_id === "usr_client_samira" || r.requester_id === "usr_client_mahmoud" || r.requester_id === "usr_client_fatma") return false
    return true
  })
}

export function getSharedRequests(): AssistanceRequest[] {
  try {
    const raw = localStorage.getItem(SHARED_REQUESTS_KEY) || localStorage.getItem(LEGACY_SHARED_REQUESTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AssistanceRequest[]
      if (Array.isArray(parsed)) {
        const cleaned = sanitizeRealRequests(parsed)
        if (cleaned.length !== parsed.length) {
          const val = JSON.stringify(cleaned)
          localStorage.setItem(SHARED_REQUESTS_KEY, val)
          localStorage.setItem(LEGACY_SHARED_REQUESTS_KEY, val)
        }
        return cleaned
      }
    }
    return []
  } catch {
    return []
  }
}

export function saveSharedRequest(request: AssistanceRequest): void {
  try {
    const list = getSharedRequests()
    const index = list.findIndex((r) => r.id === request.id)
    if (index >= 0) {
      list[index] = { ...list[index], ...request }
    } else {
      list.unshift(request)
    }

    const val = JSON.stringify(list)
    localStorage.setItem(SHARED_REQUESTS_KEY, val)
    localStorage.setItem(LEGACY_SHARED_REQUESTS_KEY, val)

    liveSync.broadcast({
      type: "request_created",
      requestId: request.id,
      request,
    })

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("wanes:shared-requests-updated", {
          detail: { request, action: index >= 0 ? "update" : "create" },
        })
      )
      window.dispatchEvent(
        new CustomEvent("nova:shared-requests-updated", {
          detail: { request, action: index >= 0 ? "update" : "create" },
        })
      )
    }
  } catch (err) {
    console.warn("Failed to persist shared request:", err)
  }
}

export function updateSharedRequest(
  requestId: string,
  updates: Partial<AssistanceRequest>
): AssistanceRequest | null {
  try {
    const list = getSharedRequests()
    const index = list.findIndex((r) => r.id === requestId)
    if (index >= 0) {
      const updated = { ...list[index], ...updates }
      list[index] = updated
      const val = JSON.stringify(list)
      localStorage.setItem(SHARED_REQUESTS_KEY, val)
      localStorage.setItem(LEGACY_SHARED_REQUESTS_KEY, val)

      liveSync.broadcast({
        type: "request_updated",
        requestId,
        status: updates.status,
        request: updated,
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wanes:shared-requests-updated", {
            detail: { request: updated, action: "update" },
          })
        )
        window.dispatchEvent(
          new CustomEvent("nova:shared-requests-updated", {
            detail: { request: updated, action: "update" },
          })
        )
      }
      return updated
    }
  } catch (err) {
    console.warn("Failed to update shared request:", err)
  }
  return null
}

export function createAssistanceRequestEntity(params: {
  id?: string
  requester_id: string
  requester_name?: string | null
  requester_gender?: Gender | null
  care_recipient_name?: string | null
  title: string
  category: RequestCategory
  description: string
  urgency?: RequestUrgency
  location_text?: string | null
  latitude?: number | null
  longitude?: number | null
  payout_amount?: number | null
  escrow_amount?: number | null
  is_paid?: boolean
  status?: AssistanceRequest["status"]
}): AssistanceRequest {
  const isEmergency = params.category === "emergency_sos" || params.urgency === "critical"
  const defaultPayout = isEmergency ? 350 : 250
  const payout = params.payout_amount ?? defaultPayout
  const escrow = params.escrow_amount ?? Math.round(payout * 0.80 * 10) / 10

  return {
    id: params.id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    requester_id: params.requester_id,
    requester_name: params.requester_name || "Community Member",
    requester_gender: params.requester_gender || null,
    care_recipient_name: params.care_recipient_name || null,
    title: params.title.trim(),
    category: params.category,
    description: params.description.trim(),
    urgency: params.urgency || "normal",
    status: params.status || "open",
    location_text: params.location_text || "Cairo, Egypt",
    latitude: params.latitude ?? null,
    longitude: params.longitude ?? null,
    assigned_volunteer_id: null,
    payout_amount: payout,
    escrow_amount: escrow,
    is_paid: params.is_paid ?? true,
    created_at: new Date().toISOString(),
  }
}

export function mergeWithSharedRequests(dbRequests: AssistanceRequest[] = []): AssistanceRequest[] {
  const localList = getSharedRequests()
  const map = new Map<string, AssistanceRequest>()

  for (const req of dbRequests) {
    if (req && req.id) {
      map.set(req.id, req)
    }
  }

  for (const localReq of localList) {
    if (!localReq || !localReq.id) continue
    const existing = map.get(localReq.id)
    if (!existing) {
      map.set(localReq.id, localReq)
    } else {
      const isProgressed =
        (localReq.status === "matched" && existing.status === "open") ||
        (localReq.status === "in_progress" && (existing.status === "open" || existing.status === "matched")) ||
        (localReq.status === "completed")

      if (isProgressed || localReq.assigned_volunteer_id) {
        map.set(localReq.id, {
          ...existing,
          ...localReq,
          status: localReq.status || existing.status,
          assigned_volunteer_id: localReq.assigned_volunteer_id || existing.assigned_volunteer_id,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime()
    const timeB = new Date(b.created_at || 0).getTime()
    return timeB - timeA
  })
}
