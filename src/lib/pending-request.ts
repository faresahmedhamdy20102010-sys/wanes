import type { RequestCategory, RequestUrgency } from "./supabase"

export type PendingRequestIntent = {
  title: string
  category: RequestCategory
  urgency: RequestUrgency
  description: string
  location_text?: string
  latitude?: number | null
  longitude?: number | null
  recipientName?: string
  amount?: number
}

const STORAGE_KEY = "wanes_pending_request_intent"
const LEGACY_STORAGE_KEY = "nova_pending_request_intent"

export function setPendingRequestIntent(data: PendingRequestIntent) {
  try {
    const val = JSON.stringify(data)
    sessionStorage.setItem(STORAGE_KEY, val)
    sessionStorage.setItem(LEGACY_STORAGE_KEY, val)
  } catch {
  }
}

export function getPendingRequestIntent(): PendingRequestIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as PendingRequestIntent
    }
  } catch {
  }
  return null
}

export function clearPendingRequestIntent() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
  }
}
