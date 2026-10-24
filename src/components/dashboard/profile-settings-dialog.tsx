import * as React from "react"
import {
  User,
  Camera,
  Upload,
  Check,
  Shield,
  Loader2,
  Save,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { type Gender } from "@/lib/supabase"

type ProfileSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSettingsDialog({
  open,
  onOpenChange,
}: ProfileSettingsDialogProps) {
  const { profile, session, updateProfile } = useAuth()

  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [age, setAge] = React.useState<string>("")
  const [gender, setGender] = React.useState<Gender | "">("")
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (open && profile) {
      setFullName(profile.full_name || "")
      setPhone(profile.phone || "")
      setAge(profile.age ? String(profile.age) : "")
      setGender(profile.gender || "")
      setAvatarPreview(profile.avatar_url || null)
      setErrors({})
    }
  }, [open, profile])

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
      toast.success("Profile picture updated!")
    }
    reader.onerror = () => {
      const fallbackUrl = URL.createObjectURL(file)
      setAvatarPreview(fallbackUrl)
      if (errors.avatar) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.avatar
          return next
        })
      }
      toast.success("Profile picture updated!")
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) newErrors.fullName = "Full name is required"

    let finalAge = profile?.age || 25
    if (age && age.trim()) {
      const numAge = Number(age.trim())
      if (isNaN(numAge) || numAge < 18 || numAge > 120) {
        newErrors.age = "Age must be between 18 and 120 years"
      } else {
        finalAge = numAge
      }
    }

    const finalGender = (gender as Gender) || profile?.gender || "male"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstErrorMessage =
        newErrors.fullName ||
        newErrors.age ||
        newErrors.gender ||
        "Please check the highlighted fields."
      toast.error(firstErrorMessage)
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        age: finalAge,
        gender: finalGender,
        avatar_url: avatarPreview,
      })

      toast.success("Profile updated successfully!")
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const roleDisplay = (profile?.role || "standard_requester").replace(/_/g, " ")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-[#1E293B] backdrop-blur-2xl text-[#F8FAFC] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#06B6D4]/20">
              <User className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#F8FAFC]">
                User Profile Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-[#94A3B8]">
                Manage your personal identity, age, and strict matching preferences
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="flex flex-col items-center gap-2.5 pb-2">
            <div className="relative group">
              <div className="size-24 rounded-full border-2 border-dashed border-[#06B6D4]/40 bg-[#0F172A] flex items-center justify-center overflow-hidden shadow-inner">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={fullName || "User Avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#94A3B8] group-hover:text-[#06B6D4] transition-colors">
                    <Camera className="size-7" />
                    <span className="text-[10px] font-semibold">No Photo</span>
                  </div>
                )}
              </div>

              {avatarPreview ? (
                <span
                  className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#059669] text-white font-bold shadow-md border-2 border-[#1E293B]"
                  title="Profile picture verified"
                >
                  <Check className="size-4 stroke-[3] text-white" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] transition-colors font-bold cursor-pointer"
                  title="Upload picture"
                >
                  <Upload className="size-3.5" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-avatar-input"
            />
            <div className="text-center">
              {avatarPreview ? (
                <div className="flex items-center justify-center gap-3">
                  <label
                    htmlFor="profile-avatar-input"
                    className="text-xs font-semibold text-[#3B82F6] hover:text-[#06B6D4] cursor-pointer underline underline-offset-2"
                  >
                    Change Photo
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-[#94A3B8] hover:text-[#EF4444] transition-colors underline underline-offset-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="profile-avatar-input"
                  className="text-xs font-semibold text-[#3B82F6] hover:text-[#06B6D4] cursor-pointer underline underline-offset-2"
                >
                  Upload Profile Picture
                </label>
              )}
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {avatarPreview ? (
                  <span className="text-[#059669] font-medium inline-flex items-center gap-1">
                    <Check className="size-3.5 stroke-[3]" /> Photo active & verified
                  </span>
                ) : (
                  "JPG, PNG or WebP image"
                )}
              </p>
            </div>
            {errors.avatar && <p className="text-xs text-[#EF4444]">{errors.avatar}</p>}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0F172A]/60 p-3 text-xs">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <Shield className="size-4 text-[#059669]" />
              <span>Role: <strong className="capitalize text-[#F8FAFC]">{roleDisplay}</strong></span>
            </div>
            <Badge
              variant="outline"
              className="border-[#059669]/30 bg-[#059669]/10 text-[10px] text-[#059669] font-bold"
            >
              Verified Member
            </Badge>
          </div>

          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="profile-fullname" className="text-xs text-[#94A3B8]">
              Full Name *
            </FieldLabel>
            <Input
              id="profile-fullname"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus-visible:border-[#3B82F6]"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
          </Field>

          <Field>
            <FieldLabel className="text-xs text-[#94A3B8]">Email Address</FieldLabel>
            <Input
              disabled
              value={profile?.email || session?.user?.email || ""}
              className="border-white/[0.04] bg-[#0F172A]/40 text-[#94A3B8] cursor-not-allowed"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field data-invalid={!!errors.age}>
              <FieldLabel htmlFor="profile-age" className="text-xs text-[#94A3B8]">
                Age *
              </FieldLabel>
              <Input
                id="profile-age"
                type="number"
                min={18}
                max={120}
                placeholder="e.g. 35"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus-visible:border-[#3B82F6]"
                aria-invalid={!!errors.age}
              />
              {errors.age && <FieldError>{errors.age}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-phone" className="text-xs text-[#94A3B8]">
                Phone
              </FieldLabel>
              <Input
                id="profile-phone"
                type="tel"
                placeholder="+20 100 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus-visible:border-[#3B82F6]"
              />
            </Field>
          </div>

          <Field data-invalid={!!errors.gender} className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel className="text-xs text-[#94A3B8]">Gender *</FieldLabel>
              <Badge className="bg-[#3B82F6]/10 text-[#06B6D4] border border-[#06B6D4]/30 text-[10px]">
                Strict Matching Rule
              </Badge>
            </div>
            <FieldDescription className="text-xs text-[#94A3B8]">
              Male clients only match with male companions. Female clients only match with female companions.
            </FieldDescription>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                  gender === "male"
                    ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/10"
                    : "border-white/[0.08] bg-[#0F172A]/80 text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                }`}
              >
                <span className="text-sm font-bold flex items-center gap-1.5">
                  {gender === "male" && <Check className="size-4 text-[#06B6D4]" />}
                  Male
                </span>
                <span className="text-[10px] text-[#94A3B8] mt-0.5">Matched with male companions</span>
              </button>

              <button
                type="button"
                onClick={() => setGender("female")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                  gender === "female"
                    ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/10"
                    : "border-white/[0.08] bg-[#0F172A]/80 text-[#94A3B8] hover:border-white/20 hover:text-[#F8FAFC]"
                }`}
              >
                <span className="text-sm font-bold flex items-center gap-1.5">
                  {gender === "female" && <Check className="size-4 text-[#06B6D4]" />}
                  Female
                </span>
                <span className="text-[10px] text-[#94A3B8] mt-0.5">Matched with female companions</span>
              </button>
            </div>
            {errors.gender && <FieldError>{errors.gender}</FieldError>}
          </Field>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/[0.08] bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-semibold gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
