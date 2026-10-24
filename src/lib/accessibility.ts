import * as React from "react"

export interface AccessibilitySettings {
  fontSizeLevel: number
  seniorMode: boolean
  highContrast: boolean
  readableFont: boolean
  reduceMotion: boolean
  highlightLinks: boolean
  readingGuide: boolean
}

export const DEFAULT_A11Y_SETTINGS: AccessibilitySettings = {
  fontSizeLevel: 0,
  seniorMode: false,
  highContrast: false,
  readableFont: false,
  reduceMotion: false,
  highlightLinks: false,
  readingGuide: false,
}

const STORAGE_KEY = "wanes_accessibility_settings"
const LEGACY_STORAGE_KEY = "nova_accessibility_settings"
const EVENT_KEY = "wanes_accessibility_changed"
const LEGACY_EVENT_KEY = "nova_accessibility_changed"

const FONT_SIZE_MAP: Record<number, string> = {
  0: "100%",
  1: "112.5%",
  2: "125%",
  3: "140%",
}

export function loadAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULT_A11Y_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_A11Y_SETTINGS,
        ...parsed,
      }
    }
  } catch (e) {
    console.error("Failed to load accessibility settings", e)
  }
  return DEFAULT_A11Y_SETTINGS
}

export function applyAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  if (settings.seniorMode && settings.fontSizeLevel === 0) {
    root.style.fontSize = FONT_SIZE_MAP[2]
  } else {
    root.style.fontSize = FONT_SIZE_MAP[settings.fontSizeLevel] || "100%"
  }

  root.classList.toggle("simple-mode", settings.seniorMode)
  root.classList.toggle("senior-mode", settings.seniorMode)
  root.classList.toggle("high-contrast", settings.highContrast)
  root.classList.toggle("readable-font", settings.readableFont)
  root.classList.toggle("reduce-motion", settings.reduceMotion)
  root.classList.toggle("highlight-links", settings.highlightLinks)
  root.classList.toggle("reading-guide-active", settings.readingGuide)
}

export function saveAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof window === "undefined") return
  try {
    const serialized = JSON.stringify(settings)
    localStorage.setItem(STORAGE_KEY, serialized)
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized)
    localStorage.setItem("wanes_simple_mode", String(settings.seniorMode))
    localStorage.setItem("nova_simple_mode", String(settings.seniorMode))
    applyAccessibilitySettings(settings)
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: settings }))
    window.dispatchEvent(new CustomEvent(LEGACY_EVENT_KEY, { detail: settings }))
    window.dispatchEvent(new CustomEvent("wanes_simple_mode_changed", { detail: { enabled: settings.seniorMode } }))
    window.dispatchEvent(new CustomEvent("nova_simple_mode_changed", { detail: { enabled: settings.seniorMode } }))
  } catch (e) {
    console.error("Failed to save accessibility settings", e)
  }
}

export function useAccessibility() {
  const [settings, setSettings] = React.useState<AccessibilitySettings>(() => {
    return loadAccessibilitySettings()
  })

  React.useEffect(() => {
    const current = loadAccessibilitySettings()
    setSettings(current)
    applyAccessibilitySettings(current)

    const handleSync = () => {
      const updated = loadAccessibilitySettings()
      setSettings(updated)
      applyAccessibilitySettings(updated)
    }

    window.addEventListener(EVENT_KEY, handleSync)
    window.addEventListener(LEGACY_EVENT_KEY, handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener(EVENT_KEY, handleSync)
      window.removeEventListener(LEGACY_EVENT_KEY, handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [])

  const updateSetting = React.useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        saveAccessibilitySettings(next)
        return next
      })
    },
    []
  )

  const resetSettings = React.useCallback(() => {
    saveAccessibilitySettings(DEFAULT_A11Y_SETTINGS)
    setSettings(DEFAULT_A11Y_SETTINGS)
  }, [])

  const increaseFontSize = React.useCallback(() => {
    setSettings((prev) => {
      const nextLevel = Math.min(3, prev.fontSizeLevel + 1)
      const next = { ...prev, fontSizeLevel: nextLevel }
      saveAccessibilitySettings(next)
      return next
    })
  }, [])

  const decreaseFontSize = React.useCallback(() => {
    setSettings((prev) => {
      const nextLevel = Math.max(0, prev.fontSizeLevel - 1)
      const next = { ...prev, fontSizeLevel: nextLevel }
      saveAccessibilitySettings(next)
      return next
    })
  }, [])

  const hasActiveSettings =
    settings.fontSizeLevel > 0 ||
    settings.seniorMode ||
    settings.highContrast ||
    settings.readableFont ||
    settings.reduceMotion ||
    settings.highlightLinks ||
    settings.readingGuide

  return {
    settings,
    updateSetting,
    resetSettings,
    increaseFontSize,
    decreaseFontSize,
    hasActiveSettings,
    fontSizePercent: FONT_SIZE_MAP[settings.fontSizeLevel] || "100%",
  }
}
