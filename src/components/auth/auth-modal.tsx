import * as React from "react"
import {
  HeartHandshake,
  Loader2,
  CheckCircle2,
  Users,
  Camera,
  Check,
  Eye,
  EyeOff,
  Coins,
  UserPlus,
  LogIn,
  Heart,
} from "lucide-react"
import { supabase, type ProfileRole, type Gender } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { validateSignIn, validateSignUp } from "@/lib/auth-validation"

export type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: "signup" | "signin"
  initialRole?: ProfileRole
  userType?: "client" | "provider"
  intentMessage?: string | null
  onAuthSuccess?: () => void
}

type ProviderOption = {
  value: "volunteer" | "paid_companion"
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const providerOptions: ProviderOption[] = [
  {
    value: "volunteer",
    title: "Volunteer",
    subtitle: "Community Aid & Service Hours",
    description: "Offer neighborly assistance, log accredited volunteer hours, and earn verified community badges.",
    icon: Users,
  },
  {
    value: "paid_companion",
    title: "Paid Service",
    subtitle: "Escrow Earnings & Direct Payouts",
    description: "Provide scheduled visits and errands with guaranteed 80% payouts protected by secure escrow.",
    icon: Coins,
  },
]

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = "signup",
  initialRole = "standard_requester",
  userType: userTypeProp,
  intentMessage,
  onAuthSuccess,
}: AuthModalProps) {
  const { navigate } = useRouter()
  const { refreshProfile } = useAuth()

  const [mode, setMode] = React.useState<"signup" | "signin">(defaultMode)

  const initialType: "client" | "provider" =
    userTypeProp ||
    (initialRole === "volunteer" || initialRole === "paid_companion" ? "provider" : "client")
  const [userType, setUserType] = React.useState<"client" | "provider">(initialType)

  const [role, setRole] = React.useState<ProfileRole | "">(
    initialRole || ""
  )

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [age, setAge] = React.useState<string>("")
  const [gender, setGender] = React.useState<Gender | "">("")
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setMode(defaultMode)
      const resolvedType =
        userTypeProp ||
        (initialRole === "volunteer" || initialRole === "paid_companion" ? "provider" : "client")
      setUserType(resolvedType)
      setRole(initialRole || "")
      setAge("")
      setGender("")
      setErrors({})
    }
  }, [open, defaultMode, initialRole, userTypeProp])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|avif|bmp|heic)$/i.test(file.name)
    if (!isImage) {
      toast.error("Please select a standard image file (JPEG, PNG, WebP).")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = (event.target?.result as string) || URL.createObjectURL(file)
      setAvatarPreview(result)
      if (errors.avatar) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.avatar
          return next
        })
      }
      toast.success("Profile photo uploaded!")
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function clearFieldError(field: string) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()

    const validation = validateSignUp({
      fullName,
      email,
      password,
      phone,
      age,
      gender,
      userType,
      role,
    })

    if (!validation.success) {
      setErrors(validation.errors)
      const firstError = Object.values(validation.errors)[0]
      if (firstError) toast.error(firstError)
      return
    }

    setLoading(true)
    try {
      const numAge = Number(age.trim()) || 24
      const finalGender: Gender = (gender as Gender) || "male"
      const finalRole: ProfileRole = (role as ProfileRole) || "standard_requester"
      const finalAvatar = avatarPreview || null

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role: finalRole,
            age: numAge,
            gender: finalGender,
            avatar_url: finalAvatar,
            is_verified: true,
            national_id_verified: true,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || email.trim(),
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role: finalRole,
            age: numAge,
            gender: finalGender,
            avatar_url: finalAvatar,
            rating: 5.0,
            is_verified: true,
            national_id_verified: true,
            senior_mode_preference: finalRole === "senior_requester",
          },
          { onConflict: "id" }
        )

        toast.success("Welcome to Wanes! Account registration completed.")
        await refreshProfile(true)
        onOpenChange(false)
        if (onAuthSuccess) {
          onAuthSuccess()
        } else {
          navigate("dashboard")
        }
      } else {
        toast.success("Account created! Please check your email to confirm registration.")
        onOpenChange(false)
      }
    } catch {
      toast.error("Unable to sign up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()

    const validation = validateSignIn({ email, password })
    if (!validation.success) {
      setErrors(validation.errors)
      const firstError = Object.values(validation.errors)[0]
      if (firstError) toast.error(firstError)
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
        setLoading(false)
        return
      }

      await refreshProfile(true)
      toast.success("Welcome back to Wanes!")
      onOpenChange(false)
      if (onAuthSuccess) {
        onAuthSuccess()
      } else {
        navigate("dashboard")
      }
    } catch {
      toast.error("Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border border-white/[0.08] bg-[#1E293B]/95 backdrop-blur-2xl text-[#F8FAFC] sm:max-w-xl rounded-2xl shadow-2xl p-6 sm:p-8">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20 mb-2">
            <HeartHandshake className="size-6" />
          </div>

          <DialogTitle className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {mode === "signup" ? "Join Wanes" : "Welcome Back"}
          </DialogTitle>

          <DialogDescription className="text-sm text-[#94A3B8]">
            {mode === "signup"
              ? "Create your real account to immediately post requests or start helping"
              : "Sign in to access your dashboard, requests, and active matches"}
          </DialogDescription>

          {intentMessage && (
            <div className="mt-3.5 w-full rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-3.5 text-xs text-[#F8FAFC] text-left flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="size-4 text-[#3B82F6] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#F8FAFC]">{intentMessage}</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Your request details are securely saved and will continue immediately upon authentication.
                </p>
              </div>
            </div>
          )}

          <div className="w-full pt-3">
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as "signup" | "signin")
                setErrors({})
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-[#0F172A] border border-white/[0.08]">
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-semibold gap-1.5 cursor-pointer text-[#94A3B8]"
                >
                  <UserPlus className="size-4" />
                  Sign Up
                </TabsTrigger>
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white font-semibold gap-1.5 cursor-pointer text-[#94A3B8]"
                >
                  <LogIn className="size-4" />
                  Log In
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} noValidate className="space-y-4 pt-2">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="modal-signin-email" className="text-xs text-[#94A3B8]">
                Email Address <span className="text-[#EF4444] font-bold">*</span>
              </FieldLabel>
              <Input
                id="modal-signin-email"
                name="email"
                type="email"
                required
                aria-required="true"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearFieldError("email")
                }}
                aria-invalid={!!errors.email}
                className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="modal-signin-password" className="text-xs text-[#94A3B8]">
                Password <span className="text-[#EF4444] font-bold">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="modal-signin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  aria-required="true"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError("password")
                  }}
                  aria-invalid={!!errors.password}
                  className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
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
              className="w-full bg-[#3B82F6] font-bold text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 gap-2 cursor-pointer shadow-md shadow-[#3B82F6]/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} noValidate className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0F172A]/90 p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setUserType("client")
                  setRole("standard_requester")
                  clearFieldError("role")
                  clearFieldError("userType")
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  userType === "client"
                    ? "bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 font-bold border border-[#06B6D4]/30"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                <Heart className="size-3.5" />
                <span>Request Care (Client)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType("provider")
                  setRole("paid_companion")
                  clearFieldError("role")
                  clearFieldError("userType")
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  userType === "provider"
                    ? "bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 font-bold border border-[#06B6D4]/30"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                <Users className="size-3.5" />
                <span>Provide Care (Helper)</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div className="size-16 rounded-full border-2 border-dashed border-[#06B6D4]/40 bg-[#0F172A] flex items-center justify-center overflow-hidden shadow-inner">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-[#94A3B8]">
                      <Camera className="size-4" />
                      <span className="text-[9px]">Photo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 text-[11px] border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                >
                  {avatarPreview ? "Change Photo" : "Upload Photo (Optional)"}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-6 text-[11px] text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field data-invalid={!!errors.fullName}>
                <FieldLabel htmlFor="modal-reg-name" className="text-xs text-[#94A3B8]">
                  Full Legal Name <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <Input
                  id="modal-reg-name"
                  name="fullName"
                  type="text"
                  required
                  aria-required="true"
                  placeholder="e.g. Omar Abdelrahman"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    clearFieldError("fullName")
                  }}
                  aria-invalid={!!errors.fullName}
                  className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                />
                {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="modal-reg-email" className="text-xs text-[#94A3B8]">
                  Email Address <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <Input
                  id="modal-reg-email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError("email")
                  }}
                  aria-invalid={!!errors.email}
                  className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>
            </div>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="modal-reg-pass" className="text-xs text-[#94A3B8]">
                Password <span className="text-[#EF4444] font-bold">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="modal-reg-pass"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  aria-required="true"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError("password")
                  }}
                  aria-invalid={!!errors.password}
                  className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field data-invalid={!!errors.age}>
                <FieldLabel htmlFor="modal-reg-age" className="text-xs text-[#94A3B8]">
                  Age <span className="text-[#EF4444] font-bold">*</span> (18+ Required)
                </FieldLabel>
                <Input
                  id="modal-reg-age"
                  name="age"
                  type="number"
                  min={18}
                  max={120}
                  required
                  aria-required="true"
                  placeholder="24"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value)
                    clearFieldError("age")
                  }}
                  aria-invalid={!!errors.age}
                  className="aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                />
                {errors.age && <FieldError>{errors.age}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="modal-reg-phone" className="text-xs text-[#94A3B8]">
                  Egyptian Phone <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <Input
                  id="modal-reg-phone"
                  name="phone"
                  type="tel"
                  required
                  aria-required="true"
                  placeholder="010 1234 5678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    clearFieldError("phone")
                  }}
                  className="font-mono aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <FieldError>{errors.phone}</FieldError>}
              </Field>
            </div>

            <Field data-invalid={!!errors.gender}>
              <div className="flex items-center justify-between">
                <FieldLabel className="text-xs text-[#94A3B8]">
                  Gender <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <span className="text-[10px] font-semibold text-[#06B6D4]">Same-Gender Matching Safe Rule</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  aria-required="true"
                  onClick={() => {
                    setGender("male")
                    clearFieldError("gender")
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    gender === "male"
                      ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#F8FAFC] ring-1 ring-[#3B82F6]"
                      : errors.gender
                      ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                      : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    {gender === "male" && <Check className="size-3.5 text-[#06B6D4]" />}
                    Male
                  </span>
                </button>

                <button
                  type="button"
                  aria-required="true"
                  onClick={() => {
                    setGender("female")
                    clearFieldError("gender")
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    gender === "female"
                      ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#F8FAFC] ring-1 ring-[#3B82F6]"
                      : errors.gender
                      ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                      : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    {gender === "female" && <Check className="size-3.5 text-[#06B6D4]" />}
                    Female
                  </span>
                </button>
              </div>
              {errors.gender && <FieldError>{errors.gender}</FieldError>}
            </Field>

            {userType === "client" ? (
              <Field data-invalid={!!errors.role} className="space-y-1.5 pt-1 border-t border-white/[0.08]">
                <FieldLabel className="text-xs font-bold text-[#F8FAFC]">
                  Client Care Profile <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-required="true"
                    onClick={() => {
                      setRole("standard_requester")
                      clearFieldError("role")
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      role === "standard_requester"
                        ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                        : errors.role
                        ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                        : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Heart className="size-3.5 text-[#3B82F6]" />
                      <span className="text-xs font-bold text-[#F8FAFC]">Family Requester</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-required="true"
                    onClick={() => {
                      setRole("senior_requester")
                      clearFieldError("role")
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      role === "senior_requester"
                        ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                        : errors.role
                        ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                        : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#059669]" />
                      <span className="text-xs font-bold text-[#F8FAFC]">Senior Requester</span>
                    </div>
                  </button>
                </div>
                {errors.role && <FieldError>{errors.role}</FieldError>}
              </Field>
            ) : (
              <Field data-invalid={!!errors.role} className="space-y-1.5 pt-1 border-t border-white/[0.08]">
                <FieldLabel className="text-xs font-bold text-[#F8FAFC]">
                  Provider Model <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {providerOptions.map((opt) => {
                    const isSelected = role === opt.value
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-required="true"
                        onClick={() => {
                          setRole(opt.value)
                          clearFieldError("role")
                        }}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                            : errors.role
                            ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                            : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="size-3.5 text-[#3B82F6]" />
                          <span className="text-xs font-bold text-[#F8FAFC]">{opt.title}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.role && <FieldError>{errors.role}</FieldError>}
              </Field>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full bg-[#3B82F6] font-bold text-white hover:bg-[#2563EB] gap-2 cursor-pointer shadow-md shadow-[#3B82F6]/20 border border-[#06B6D4]/30 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Create Account &amp; Continue</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
