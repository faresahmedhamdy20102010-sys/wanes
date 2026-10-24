import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/lib/auth-context.tsx"
import { RouterProvider } from "@/lib/router.tsx"
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="wanes-theme">
      <RouterProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  </StrictMode>
)
