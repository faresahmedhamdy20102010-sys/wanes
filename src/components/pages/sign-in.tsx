import * as React from "react"
import { HeartHandshake, Loader2, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { validateSignIn } from "@/lib/auth-validation"

export function SignInPage() {
  const { navigate } = useRouter()
  const { session, refreshProfile } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({})

  React.useEffect(() => {
    if (session) {
      navigate("dashboard")
    }
  }, [session, navigate])

  function handleFieldChange(field: "email" | "password", value: string) {
    if (field === "email") {
      setEmail(value)
    } else {
      setPassword(value)
    }

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleBlur(field: "email" | "password") {
    const val = field === "email" ? email : password
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validation = validateSignIn({ email, password })
    if (!validation.success) {
      setErrors(validation.errors)
      const firstError = Object.values(validation.errors)[0]
      if (firstError) {
        toast.error(firstError)
      }
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        await refreshProfile(true)
        toast.success("Welcome back to Wanes")
        navigate("dashboard")
      }
    } catch {
      toast.error("Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0F172A] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="group flex flex-col items-center gap-3 text-center cursor-pointer transition-transform hover:scale-105 focus:outline-none"
            aria-label="Return to Wanes Home"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#3B82F6] border border-[#06B6D4]/30 text-white shadow-md shadow-black/40 group-hover:shadow-lg transition-all">
              <HeartHandshake className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors">
                Welcome back
              </h1>
              <p className="text-sm text-[#94A3B8]">Sign in to your Wanes account</p>
            </div>
          </button>
        </div>

        <Card className="glass-card bg-[#1E293B] border-[#06B6D4]/15 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#F8FAFC]">Sign In</CardTitle>
            <CardDescription className="text-xs text-[#94A3B8]">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email" className="text-xs text-[#94A3B8]">
                  Email Address <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={!!errors.email}
                  className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password" className="text-xs text-[#94A3B8]">
                  Password <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    aria-required="true"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    aria-invalid={!!errors.password}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-bold shadow-md shadow-[#3B82F6]/20 transition-all cursor-pointer"
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin text-white" />}
                Sign In
              </Button>

              <div className="text-center text-sm text-[#94A3B8]">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("signup")}
                  className="font-medium text-[#3B82F6] hover:text-[#06B6D4] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
