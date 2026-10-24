import * as React from "react"
import {
  Users,
  UserPlus,
  Heart,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle2,
  Activity,
  Plus,
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export type CareRecipient = {
  id: string
  name: string
  relationship: string
  age: number
  conditions: string
  emergency_phone: string
  address: string
  preferred_schedule: string
  status: "active" | "needs_check_in" | "away"
  created_at: string
}

const STORAGE_KEY = "wanes_care_recipients"
const LEGACY_STORAGE_KEY = "nova_care_recipients"

export function getStoredRecipients(): CareRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error("Failed to parse care recipients from storage", e)
  }
  return []
}

export function saveStoredRecipients(list: CareRecipient[]) {
  try {
    const val = JSON.stringify(list)
    localStorage.setItem(STORAGE_KEY, val)
    localStorage.setItem(LEGACY_STORAGE_KEY, val)
  } catch (e) {
    console.error("Failed to persist care recipients", e)
  }
}

type CareRecipientsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: CareRecipient[]
  onRecipientsChange: (recipients: CareRecipient[]) => void
  onRequestVisitFor?: (recipient: CareRecipient) => void
}

export function CareRecipientsDialog({
  open,
  onOpenChange,
  recipients,
  onRecipientsChange,
  onRequestVisitFor,
}: CareRecipientsDialogProps) {
  const { session } = useAuth()
  const [isAdding, setIsAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const [name, setName] = React.useState("")
  const [relationship, setRelationship] = React.useState("")
  const [age, setAge] = React.useState("75")
  const [conditions, setConditions] = React.useState("")
  const [emergencyPhone, setEmergencyPhone] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [preferredSchedule, setPreferredSchedule] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function resetForm() {
    setName("")
    setRelationship("")
    setAge("75")
    setConditions("")
    setEmergencyPhone("")
    setAddress("")
    setPreferredSchedule("")
    setEditingId(null)
    setIsAdding(false)
    setErrors({})
  }

  function handleOpenAdd() {
    resetForm()
    setIsAdding(true)
  }

  function handleStartEdit(recipient: CareRecipient) {
    setEditingId(recipient.id)
    setName(recipient.name)
    setRelationship(recipient.relationship)
    setAge(String(recipient.age))
    setConditions(recipient.conditions || "")
    setEmergencyPhone(recipient.emergency_phone || "")
    setAddress(recipient.address || "")
    setPreferredSchedule(recipient.preferred_schedule || "")
    setIsAdding(true)
  }

  async function handleDelete(id: string) {
    const next = recipients.filter((r) => r.id !== id)
    onRecipientsChange(next)
    saveStoredRecipients(next)
    toast.success("Care recipient profile removed.")

    if (session?.user?.id) {
      try {
        await supabase.from("care_recipients").delete().eq("id", id).eq("user_id", session.user.id)
      } catch {
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Full name is required"
    if (!relationship.trim()) newErrors.relationship = "Relationship is required"
    if (!emergencyPhone.trim()) newErrors.emergencyPhone = "Emergency contact phone is required"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    if (editingId) {
      const updatedItem = {
        name: name.trim(),
        relationship: relationship.trim(),
        age: parseInt(age, 10) || 75,
        conditions: conditions.trim(),
        emergency_phone: emergencyPhone.trim(),
        address: address.trim(),
        preferred_schedule: preferredSchedule.trim(),
      }
      const next = recipients.map((r) =>
        r.id === editingId
          ? {
              ...r,
              ...updatedItem,
            }
          : r
      )
      onRecipientsChange(next)
      saveStoredRecipients(next)
      toast.success(`Updated ${name.trim()}'s profile!`)

      if (session?.user?.id) {
        try {
          await supabase
            .from("care_recipients")
            .update(updatedItem)
            .eq("id", editingId)
            .eq("user_id", session.user.id)
        } catch {
        }
      }
    } else {
      const newRecipient: CareRecipient = {
        id: `cr-${Date.now()}`,
        name: name.trim(),
        relationship: relationship.trim(),
        age: parseInt(age, 10) || 75,
        conditions: conditions.trim(),
        emergency_phone: emergencyPhone.trim(),
        address: address.trim(),
        preferred_schedule: preferredSchedule.trim(),
        status: "active",
        created_at: new Date().toISOString(),
      }
      const next = [newRecipient, ...recipients]
      onRecipientsChange(next)
      saveStoredRecipients(next)
      toast.success(`Added ${name.trim()} to your Care Recipients!`)

      if (session?.user?.id) {
        try {
          await supabase.from("care_recipients").insert({
            user_id: session.user.id,
            ...newRecipient,
          })
        } catch {
        }
      }
    }

    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border border-white/[0.08] bg-[#1E293B] backdrop-blur-2xl rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F8FAFC]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#06B6D4]/20">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                Manage Care Recipients
              </DialogTitle>
              <DialogDescription className="text-xs text-[#94A3B8] mt-0.5">
                Register family members and loved ones to schedule visits and track safety.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isAdding ? (
          <div className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Registered Loved Ones ({recipients.length})
              </p>
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="gap-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-semibold rounded-xl h-9"
              >
                <Plus className="size-4" />
                Add Recipient
              </Button>
            </div>

            {recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0F172A]/40 p-10 text-center">
                <Heart className="size-10 text-[#94A3B8]/60 mb-2" />
                <p className="font-bold text-[#F8FAFC]">No recipients added yet</p>
                <p className="text-xs text-[#94A3B8] max-w-sm mt-1 mb-4">
                  Add your elderly parents or loved ones to coordinate verified community assistance.
                </p>
                <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-semibold rounded-xl">
                  <UserPlus className="size-4" />
                  Add First Loved One
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recipients.map((rec) => (
                  <div
                    key={rec.id}
                    className="group rounded-2xl border border-white/[0.08] bg-[#0F172A]/80 p-4 transition-all hover:border-[#06B6D4]/40 hover:bg-[#0F172A]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/10 border border-[#06B6D4]/30 text-base font-bold text-[#06B6D4]">
                          {rec.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-[#F8FAFC]">{rec.name}</h4>
                            <Badge
                              variant="outline"
                              className="border-white/[0.08] bg-white/[0.04] text-xs text-[#94A3B8]"
                            >
                              {rec.relationship} · {rec.age} yrs
                            </Badge>
                            {rec.status === "active" ? (
                              <Badge className="bg-[#059669]/20 text-[#059669] border border-[#059669]/30 text-xs">
                                <CheckCircle2 className="mr-1 size-3" />
                                Active Care
                              </Badge>
                            ) : (
                              <Badge className="bg-[#3B82F6]/20 text-[#06B6D4] border border-[#06B6D4]/30 text-xs">
                                <Activity className="mr-1 size-3" />
                                Check-in due
                              </Badge>
                            )}
                          </div>

                          {rec.conditions && (
                            <p className="text-xs text-[#94A3B8] leading-relaxed">
                              {rec.conditions}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-[#94A3B8]">
                            {rec.emergency_phone && (
                              <span className="flex items-center gap-1 text-[#F8FAFC]">
                                <Phone className="size-3 text-[#3B82F6]" />
                                {rec.emergency_phone}
                              </span>
                            )}
                            {rec.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3 text-[#94A3B8]" />
                                <span className="truncate max-w-[200px]">{rec.address}</span>
                              </span>
                            )}
                            {rec.preferred_schedule && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3 text-[#3B82F6]" />
                                {rec.preferred_schedule}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {onRequestVisitFor && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onOpenChange(false)
                              onRequestVisitFor(rec)
                            }}
                            className="h-8 border-[#06B6D4]/30 text-[#06B6D4] hover:bg-[#3B82F6]/10 text-xs"
                          >
                            <Calendar className="mr-1 size-3" />
                            Request Visit
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(rec)}
                          className="size-8 text-[#94A3B8] hover:text-[#F8FAFC]"
                          aria-label="Edit recipient"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(rec.id)}
                          className="size-8 text-[#94A3B8] hover:text-[#EF4444]"
                          aria-label="Delete recipient"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="rec-name" className="text-xs text-[#94A3B8]">
                  Full Name *
                </FieldLabel>
                <Input
                  id="rec-name"
                  placeholder="e.g. Margaret Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field data-invalid={!!errors.relationship}>
                  <FieldLabel htmlFor="rec-rel" className="text-xs text-[#94A3B8]">
                    Relationship *
                  </FieldLabel>
                  <Input
                    id="rec-rel"
                    placeholder="e.g. Mother, Father"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rec-age" className="text-xs text-[#94A3B8]">
                    Age
                  </FieldLabel>
                  <Input
                    id="rec-age"
                    type="number"
                    min={1}
                    max={120}
                    placeholder="75"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                  />
                </Field>
              </div>
            </div>

            <Field data-invalid={!!errors.emergencyPhone}>
              <FieldLabel htmlFor="rec-phone" className="text-xs text-[#94A3B8]">
                Emergency Contact Phone *
              </FieldLabel>
              <Input
                id="rec-phone"
                placeholder="+1 (555) 000-0000"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
              />
              {errors.emergencyPhone && <FieldError>{errors.emergencyPhone}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="rec-addr" className="text-xs text-[#94A3B8]">
                Home Address / Residence
              </FieldLabel>
              <Input
                id="rec-addr"
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="rec-sched" className="text-xs text-[#94A3B8]">
                Preferred Visit Days / Schedule
              </FieldLabel>
              <Input
                id="rec-sched"
                placeholder="e.g. Mon, Wed, Fri afternoons"
                value={preferredSchedule}
                onChange={(e) => setPreferredSchedule(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="rec-cond" className="text-xs text-[#94A3B8]">
                Health Notes, Mobility & Care Preferences
              </FieldLabel>
              <Textarea
                id="rec-cond"
                placeholder="e.g. Needs walker for outdoor walks, preferred language, hearing assistance..."
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6]"
                rows={3}
              />
            </Field>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-white/[0.08] bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-[#06B6D4]/30 font-medium"
              >
                {editingId ? "Save Changes" : "Register Recipient"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
