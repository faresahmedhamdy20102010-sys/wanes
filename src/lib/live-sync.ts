export type LiveSyncEvent =
  | { type: "request_created"; requestId?: string; request?: any }
  | { type: "request_updated"; requestId?: string; status?: string; request?: any }
  | { type: "terms_negotiated"; requestId?: string }

class LiveSyncManager {
  private channel: BroadcastChannel | null = null
  private legacyChannel: BroadcastChannel | null = null
  private listeners = new Set<(event: LiveSyncEvent) => void>()

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("wanes_live_data_stream")
        this.legacyChannel = new BroadcastChannel("nova_live_data_stream")
        const handler = (msg: MessageEvent) => {
          if (msg.data) {
            this.notifyListeners(msg.data as LiveSyncEvent)
          }
        }
        this.channel.onmessage = handler
        this.legacyChannel.onmessage = handler
      } catch (e) {
        console.warn("BroadcastChannel not supported", e)
      }
    }
  }

  broadcast(event: LiveSyncEvent) {
    this.notifyListeners(event)
    try {
      this.channel?.postMessage(event)
      this.legacyChannel?.postMessage(event)
    } catch {
    }
  }

  subscribe(listener: (event: LiveSyncEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(event: LiveSyncEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event)
      } catch (e) {
        console.error("Live sync subscriber error", e)
      }
    })
  }
}

export const liveSync = new LiveSyncManager()
