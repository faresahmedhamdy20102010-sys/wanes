import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: ["**/*.mp4", "**/*.webp", "**/*.webm"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["react", "react-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-animation": ["gsap", "@gsap/react"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
})
