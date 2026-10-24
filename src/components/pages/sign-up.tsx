import * as React from "react"
import {
  HeartHandshake,
  Loader2,
  Camera,
  Check,
  Eye,
  EyeOff,
  Users,
  Coins,
  Heart,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { supabase, type ProfileRole, type Gender } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { validateSignUp } from "@/lib/auth-validation"

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
    description: "Support elderly neighbors, log accredited volunteer hours, and earn verified impact credentials.",
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

export function SignUpPage() {
  const { navigate, params } = useRouter()
  const { session, refreshProfile } = useAuth()

  React.useEffect(() => {
    if (session) {
      navigate("dashboard")
    }
  }, [session, navigate])

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [age, setAge] = React.useState<string>("")
  const [gender, setGender] = React.useState<Gender | "">("")
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const isProviderParam =
    params.role === "volunteer" ||
    params.role === "paid_companion" ||
    params.type === "provider"

  const [userType, setUserType] = React.useState<"client" | "provider">(
    isProviderParam ? "provider" : "client"
  )

  const [role, setRole] = React.useState<ProfileRole | "">(
    params.role === "volunteer" ||
    params.role === "paid_companion" ||
    params.role === "senior_requester" ||
    params.role === "standard_requester"
      ? (params.role as ProfileRole)
      : ""
  )

  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|avif|bmp|heic)$/i.test(file.name)
    if (!isImage) {
      toast.error("Please upload a standard image file (JPEG, PNG, WebP).")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = (event.target?.result as string) || URL.createObjectURL(file)
      setAvatarPreview(result)
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

  function handleBlur(field: string, val: string) {
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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
      const firstErrorMessage = Object.values(validation.errors)[0]
      if (firstErrorMessage) {
        toast.error(firstErrorMessage)
      }
      return
    }

    setLoading(true)
    try {
      const finalAge = Number(age.trim()) || 24
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
            age: finalAge,
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
            age: finalAge,
            gender: finalGender,
            avatar_url: finalAvatar,
            rating: 5.0,
            is_verified: true,
            national_id_verified: true,
            senior_mode_preference: finalRole === "senior_requester",
          },
          { onConflict: "id" }
        )

        toast.success("Welcome to Wanes! Account registration completed successfully.")
        await refreshProfile(true)
        navigate("dashboard")
      } else {
        toast.success("Account created! Please check your email to confirm registration.")
      }
    } catch {
      toast.error("Unable to sign up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0F172A] px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
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
                Create Your Account
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Join Wanes to request care assistance or provide support as a helper
              </p>
            </div>
          </button>
        </div>

        <Card className="glass-card bg-[#1E293B] border-[#06B6D4]/15 backdrop-blur-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-[#F8FAFC]">
                  {userType === "client" ? "Care Requester Registration" : "Helper Registration"}
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Fill in your details to immediately access your live Wanes dashboard
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#059669]/15 px-3 py-1 text-xs font-semibold text-[#059669] border border-[#059669]/30">
                <ShieldCheck className="size-3.5 text-[#059669]" />
                <span>Instant Verification</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0F172A]/90 p-1 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setUserType("client")
                    setRole("standard_requester")
                    clearFieldError("role")
                    clearFieldError("userType")
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    userType === "provider"
                      ? "bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 font-bold border border-[#06B6D4]/30"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  <Users className="size-3.5" />
                  <span>Provide Care (Helper)</span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 pt-1 pb-1">
                <div className="relative group">
                  <div className="size-20 rounded-full border-2 border-dashed border-[#06B6D4]/40 bg-[#0F172A] flex items-center justify-center overflow-hidden shadow-inner">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[#94A3B8]">
                        <Camera className="size-5" />
                        <span className="text-[10px]">Photo</span>
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
                    className="h-7 text-xs border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    {avatarPreview ? "Change Photo" : "Upload Photo (Optional)"}
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="h-7 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field data-invalid={!!errors.fullName}>
                  <FieldLabel htmlFor="reg-fullname" className="text-xs text-[#94A3B8]">
                    Full Legal Name <span className="text-[#EF4444] font-bold">*</span>
                  </FieldLabel>
                  <Input
                    id="reg-fullname"
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
                    onBlur={() => handleBlur("fullName", fullName)}
                    aria-invalid={!!errors.fullName}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                  />
                  {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="reg-email" className="text-xs text-[#94A3B8]">
                    Email Address <span className="text-[#EF4444] font-bold">*</span>
                  </FieldLabel>
                  <Input
                    id="reg-email"
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
                    onBlur={() => handleBlur("email", email)}
                    aria-invalid={!!errors.email}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                  />
                  {errors.email && <FieldError>{errors.email}</FieldError>}
                </Field>
              </div>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="reg-password" className="text-xs text-[#94A3B8]">
                  Password <span className="text-[#EF4444] font-bold">*</span>
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="reg-password"
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
                    onBlur={() => handleBlur("password", password)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field data-invalid={!!errors.age}>
                  <FieldLabel htmlFor="reg-age" className="text-xs text-[#94A3B8]">
                    Age <span className="text-[#EF4444] font-bold">*</span> (18+ Required)
                  </FieldLabel>
                  <Input
                    id="reg-age"
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
                    onBlur={() => handleBlur("age", age)}
                    aria-invalid={!!errors.age}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
                  />
                  {errors.age && <FieldError>{errors.age}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="reg-phone" className="text-xs text-[#94A3B8]">
                    Egyptian Phone Number <span className="text-[#EF4444] font-bold">*</span>
                  </FieldLabel>
                  <Input
                    id="reg-phone"
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
                    onBlur={() => handleBlur("phone", phone)}
                    className="font-mono border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] aria-invalid:border-[#EF4444] aria-invalid:ring-1 aria-invalid:ring-[#EF4444]/40"
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
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    aria-required="true"
                    onClick={() => {
                      setGender("male")
                      clearFieldError("gender")
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
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
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
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
                <Field data-invalid={!!errors.role} className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <FieldLabel className="text-xs font-bold text-[#F8FAFC]">
                    Client Care Profile <span className="text-[#EF4444] font-bold">*</span>
                  </FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-required="true"
                      onClick={() => {
                        setRole("standard_requester")
                        clearFieldError("role")
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        role === "standard_requester"
                          ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                          : errors.role
                          ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                          : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="size-4 text-[#3B82F6]" />
                        <span className="text-xs font-bold text-[#F8FAFC]">Family Member / Caregiver</span>
                      </div>
                      <span className="text-[10px] text-[#06B6D4] block mt-0.5">Managing care for parents or family</span>
                    </button>

                    <button
                      type="button"
                      aria-required="true"
                      onClick={() => {
                        setRole("senior_requester")
                        clearFieldError("role")
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        role === "senior_requester"
                          ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                          : errors.role
                          ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                          : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-[#059669]" />
                        <span className="text-xs font-bold text-[#F8FAFC]">Senior Requester</span>
                      </div>
                      <span className="text-[10px] text-[#34D399] block mt-0.5">High-contrast accessibility mode enabled</span>
                    </button>
                  </div>
                  {errors.role && <FieldError>{errors.role}</FieldError>}
                </Field>
              ) : (
                <Field data-invalid={!!errors.role} className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <FieldLabel className="text-xs font-bold text-[#F8FAFC]">
                    Provider Model <span className="text-[#EF4444] font-bold">*</span>
                  </FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]"
                              : errors.role
                              ? "border-[#EF4444]/60 bg-[#0F172A]/60 text-[#94A3B8]"
                              : "border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-[#3B82F6]" />
                            <span className="text-xs font-bold text-[#F8FAFC]">{opt.title}</span>
                          </div>
                          <span className="text-[10px] text-[#06B6D4] block mt-0.5">{opt.subtitle}</span>
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
                      <span>Create Account &amp; Access Dashboard</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-[#94A3B8] pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("signin")}
                  className="font-medium text-[#3B82F6] hover:text-[#06B6D4] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
