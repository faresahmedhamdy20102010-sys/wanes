import * as React from "react"
import { toast } from "sonner"

export const SIMPLE_MODE_STORAGE_KEY = "wanes_simple_mode"
export const LEGACY_SIMPLE_MODE_STORAGE_KEY = "nova_simple_mode"
export const SIMPLE_MODE_EVENT_KEY = "wanes_simple_mode_changed"
export const LEGACY_SIMPLE_MODE_EVENT_KEY = "nova_simple_mode_changed"

export function getSimpleMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    const val = localStorage.getItem(SIMPLE_MODE_STORAGE_KEY) || localStorage.getItem(LEGACY_SIMPLE_MODE_STORAGE_KEY)
    if (val !== null) {
      return val === "true"
    }
    const legacy = localStorage.getItem("wanes_accessibility_settings") || localStorage.getItem("nova_accessibility_settings")
    if (legacy) {
      const parsed = JSON.parse(legacy)
      return !!parsed.seniorMode
    }
  } catch (e) {
    console.error("Failed to read Simple Mode state", e)
  }
  return false
}

export function applySimpleMode(enabled: boolean) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  if (enabled) {
    root.style.fontSize = "125%"
    root.classList.add("simple-mode", "senior-mode", "high-contrast", "readable-font")
    root.classList.remove("highlight-links", "reading-guide-active")
  } else {
    root.style.fontSize = "100%"
    root.classList.remove(
      "simple-mode",
      "senior-mode",
      "high-contrast",
      "readable-font",
      "highlight-links",
      "reduce-motion",
      "reading-guide-active"
    )
  }
}

export function setSimpleMode(enabled: boolean, notify = false) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, String(enabled))
    localStorage.setItem(LEGACY_SIMPLE_MODE_STORAGE_KEY, String(enabled))
    applySimpleMode(enabled)
    window.dispatchEvent(
      new CustomEvent(SIMPLE_MODE_EVENT_KEY, { detail: { enabled } })
    )
    window.dispatchEvent(
      new CustomEvent(LEGACY_SIMPLE_MODE_EVENT_KEY, { detail: { enabled } })
    )

    try {
      const key = "wanes_accessibility_settings"
      const legacyKey = "nova_accessibility_settings"
      const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey)
      const parsed = raw ? JSON.parse(raw) : {}
      parsed.seniorMode = enabled
      parsed.fontSizeLevel = enabled ? 2 : 0
      parsed.highContrast = enabled
      parsed.readableFont = enabled
      const serialized = JSON.stringify(parsed)
      localStorage.setItem(key, serialized)
      localStorage.setItem(legacyKey, serialized)
      window.dispatchEvent(
        new CustomEvent("wanes_accessibility_changed", { detail: parsed })
      )
      window.dispatchEvent(
        new CustomEvent("nova_accessibility_changed", { detail: parsed })
      )
    } catch {}

    if (notify) {
      if (enabled) {
        toast.success("Simple Mode Activated", {
          description: "Larger text, higher contrast, and streamlined layout enabled.",
          duration: 3000,
        })
      } else {
        toast.info("Standard Mode Restored", {
          description: "Default typography and layout restored.",
          duration: 2500,
        })
      }
    }
  } catch (e) {
    console.error("Failed to save Simple Mode state", e)
  }
}

export function useSimpleMode() {
  const [isSimpleMode, setIsSimpleMode] = React.useState<boolean>(() => {
    return getSimpleMode()
  })

  React.useEffect(() => {
    const current = getSimpleMode()
    setIsSimpleMode(current)
    applySimpleMode(current)

    const handleSync = () => {
      const updated = getSimpleMode()
      setIsSimpleMode(updated)
      applySimpleMode(updated)
    }

    window.addEventListener(SIMPLE_MODE_EVENT_KEY, handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener(SIMPLE_MODE_EVENT_KEY, handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [])

  const toggleSimpleMode = React.useCallback(() => {
    const next = !getSimpleMode()
    setSimpleMode(next, true)
    setIsSimpleMode(next)
  }, [])

  return {
    isSimpleMode,
    toggleSimpleMode,
    setSimpleMode: (val: boolean, notify = false) => {
      setSimpleMode(val, notify)
      setIsSimpleMode(val)
    },
  }
}
