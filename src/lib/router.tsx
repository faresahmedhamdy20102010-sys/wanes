
import * as React from "react"

export const VALID_ROUTES = [
  "home",
  "signin",
  "signup",
  "dashboard",
  "services",
  "safety",
  "volunteer",
  "create-request",
  "notifications",
  "checkout",
  "verification",
  "admin",
] as const

export type Route = (typeof VALID_ROUTES)[number]

export interface RouterContextValue {
  route: Route
  params: Record<string, string>
  navigate: (route: Route, params?: Record<string, string>) => void
}

const RouterContext = React.createContext<RouterContextValue | undefined>(undefined)

function parseHash(): { route: Route; params: Record<string, string> } {
  if (typeof window === "undefined") {
    return { route: "home", params: {} }
  }

  const hash = window.location.hash.replace(/^#\/?/, "")
  const [path, queryString] = hash.split("?")
  const params: Record<string, string> = {}

  if (queryString) {
    for (const pair of queryString.split("&")) {
      const [key, value] = pair.split("=")
      if (key) {
        try {
          params[decodeURIComponent(key)] = decodeURIComponent(value || "")
        } catch {
          params[key] = value || ""
        }
      }
    }
  }

  const route: Route = VALID_ROUTES.includes(path as Route) ? (path as Route) : "home"
  return { route, params }
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState(parseHash)

  React.useEffect(() => {
    const onHashChange = () => setState(parseHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const navigate = React.useCallback(
    (route: Route, params?: Record<string, string>) => {
      let hash = `#/${route}`
      if (params && Object.keys(params).length > 0) {
        const qs = Object.entries(params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&")
        hash += `?${qs}`
      }
      if (window.location.hash !== hash) {
        window.location.hash = hash
      }
      window.scrollTo({ top: 0, behavior: "instant" })
    },
    []
  )

  const value = React.useMemo<RouterContextValue>(
    () => ({ ...state, navigate }),
    [state, navigate]
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterContextValue {
  const ctx = React.useContext(RouterContext)
  if (!ctx) {
    throw new Error("useRouter must be used within a RouterProvider")
  }
  return ctx
}
