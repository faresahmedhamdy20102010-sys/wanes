export type NegotiationStatus =
  | "draft"
  | "pending_provider"
  | "pending_client"
  | "agreed"
  | "declined"

export type ProposalSenderRole = "client" | "provider"

export type NegotiationProposal = {
  id: string
  requestId: string
  senderRole: ProposalSenderRole
  senderName: string
  proposedPrice: number
  proposedEscrow: number
  proposedHours?: number
  message: string
  status: "pending" | "countered" | "accepted" | "declined"
  createdAt: string
}

export type NegotiationThread = {
  requestId: string
  requestTitle: string
  category: string
  requesterName: string
  providerName?: string
  currentStatus: NegotiationStatus
  originalPrice: number
  currentPrice: number
  agreedPrice?: number
  proposals: NegotiationProposal[]
  updatedAt: string
}

import { liveSync } from "./live-sync"

const STORAGE_KEY = "wanes_service_negotiations"
const LEGACY_STORAGE_KEY = "nova_service_negotiations"

export function loadAllNegotiations(): Record<string, NegotiationThread> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, NegotiationThread>
      }
    }
  } catch (e) {
    console.error("Failed to parse negotiations from storage", e)
  }
  return {}
}

export function saveAllNegotiations(threads: Record<string, NegotiationThread>, broadcastRequestId?: string) {
  try {
    const val = JSON.stringify(threads)
    localStorage.setItem(STORAGE_KEY, val)
    localStorage.setItem(LEGACY_STORAGE_KEY, val)
    if (broadcastRequestId) {
      liveSync.broadcast({ type: "terms_negotiated", requestId: broadcastRequestId })
    }
  } catch (e) {
    console.error("Failed to save negotiations", e)
  }
}

export function getNegotiationForRequest(requestId: string): NegotiationThread | null {
  const threads = loadAllNegotiations()
  return threads[requestId] || null
}

export function submitCounterProposal(
  requestId: string,
  requestTitle: string,
  category: string,
  requesterName: string,
  senderRole: ProposalSenderRole,
  senderName: string,
  proposedPrice: number,
  proposedHours: number | undefined,
  message: string,
  fallbackOriginalPrice = 250
): NegotiationThread {
  const threads = loadAllNegotiations()
  let thread = threads[requestId]

  if (!thread) {
    thread = {
      requestId,
      requestTitle,
      category,
      requesterName,
      providerName: senderRole === "provider" ? senderName : undefined,
      currentStatus: senderRole === "provider" ? "pending_client" : "pending_provider",
      originalPrice: fallbackOriginalPrice,
      currentPrice: proposedPrice,
      proposals: [],
      updatedAt: new Date().toISOString(),
    }
  }

  const updatedProposals = thread.proposals.map((p) =>
    p.status === "pending" ? { ...p, status: "countered" as const } : p
  )

  const newProposal: NegotiationProposal = {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    requestId,
    senderRole,
    senderName,
    proposedPrice,
    proposedEscrow: Math.round(proposedPrice * 0.80 * 10) / 10,
    proposedHours,
    message,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  thread.proposals = [...updatedProposals, newProposal]
  thread.currentPrice = proposedPrice
  thread.currentStatus = senderRole === "provider" ? "pending_client" : "pending_provider"
  thread.updatedAt = new Date().toISOString()
  if (senderRole === "provider") {
    thread.providerName = senderName
  }

  threads[requestId] = thread
  saveAllNegotiations(threads, requestId)
  return thread
}

export function acceptNegotiationProposal(
  requestId: string,
  proposalId: string,
  _acceptedByRole?: ProposalSenderRole
): NegotiationThread | null {
  const threads = loadAllNegotiations()
  const thread = threads[requestId]
  if (!thread) return null

  let acceptedAmount = thread.currentPrice
  thread.proposals = thread.proposals.map((p) => {
    if (p.id === proposalId) {
      acceptedAmount = p.proposedPrice
      return { ...p, status: "accepted" as const }
    }
    return p
  })

  thread.agreedPrice = acceptedAmount
  thread.currentPrice = acceptedAmount
  thread.currentStatus = "agreed"
  thread.updatedAt = new Date().toISOString()

  threads[requestId] = thread
  saveAllNegotiations(threads, requestId)
  return thread
}

export function declineNegotiation(requestId: string): NegotiationThread | null {
  const threads = loadAllNegotiations()
  const thread = threads[requestId]
  if (!thread) return null

  thread.currentStatus = "declined"
  thread.proposals = thread.proposals.map((p) =>
    p.status === "pending" ? { ...p, status: "declined" as const } : p
  )
  thread.updatedAt = new Date().toISOString()

  threads[requestId] = thread
  saveAllNegotiations(threads, requestId)
  return thread
}
