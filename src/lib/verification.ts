import type { Profile } from "@/lib/supabase"
import {
  evaluateApplicationRuleBased,
  type AIVerificationAnalysis,
} from "./verification-ai"

export { evaluateApplicationRuleBased, type AIVerificationAnalysis }

export type VerificationDocumentStatus = "pending" | "approved" | "rejected"

export type EgyptianNationalIdInfo = {
  valid: boolean
  rawId: string
  formattedId: string
  century: number
  centuryLabel: string
  birthDate: string
  birthYear: number
  birthMonth: number
  birthDay: number
  age: number
  governorateCode: string
  governorateName: string
  governorateNameAr: string
  gender: "male" | "female"
  genderLabel: string
  genderLabelAr: string
  serialNumber: string
  calculatedCheckDigit: number
  actualCheckDigit: number
  checksumPassed: boolean
  reason?: string
}

export type HelperVerificationData = {
  nationalIdNumber: string
  nationalIdFrontImage: string
  nationalIdBackImage: string
  nationalIdImage?: string
  universityIdImage: string
  universityName: string
  studentIdNumber?: string
  policeRecordImage: string
  policeRecordIssueDate?: string
  verificationSelfieImage: string
  ageConfirmed: boolean
  confirmedAge: number
  submittedAt: string
  status: VerificationDocumentStatus
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  decodedId?: EgyptianNationalIdInfo
}

export type ClientVerificationData = {
  streetAddress: string
  buildingApartment: string
  cityDistrict: string
  governorate: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  nationalIdNumber: string
  nationalIdImage: string
  submittedAt: string
  status?: VerificationDocumentStatus
}

export type VerificationState = {
  isVerified: boolean
  isProvider: boolean
  status: VerificationDocumentStatus | "unsubmitted"
  missingRequirements: string[]
  helperData: HelperVerificationData | null
  clientData: ClientVerificationData | null
  rejectionReason?: string
}

export type HelperVerificationRecord = {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  role: "volunteer" | "paid_companion"
  isRealSubmission?: boolean
  routedToAdmin?: string
  submittedAt?: string
  verification: HelperVerificationData
  aiAnalysis?: AIVerificationAnalysis
}

export const MASTER_ADMIN_EMAIL = "admin@wanes.care"
export const MASTER_ADMIN_NAME = "Admin Hazem (Chief Trust & Safety Officer)"
export const ADMIN_QUEUE_ROUTING_KEY = "wanes_admin_exclusive_queue_v1"
export const LEGACY_ADMIN_QUEUE_ROUTING_KEY = "nova_admin_exclusive_queue_v1"
export const VERIFICATION_TESTING_BYPASS_KEY = "wanes_skip_verification"
export const LEGACY_VERIFICATION_TESTING_BYPASS_KEY = "nova_skip_verification"
const HELPER_STORAGE_PREFIX = "wanes_helper_verification_"
const LEGACY_HELPER_STORAGE_PREFIX = "nova_helper_verification_"
const CLIENT_STORAGE_PREFIX = "wanes_client_verification_"
const LEGACY_CLIENT_STORAGE_PREFIX = "nova_client_verification_"
const ALL_APPLICATIONS_STORAGE_KEY = "wanes_all_helper_verifications"
const LEGACY_ALL_APPLICATIONS_STORAGE_KEY = "nova_all_helper_verifications"

export function isVerificationTestingBypassed(): boolean {
  return true
}

export function setVerificationTestingBypassed(bypassed: boolean): void {
  if (typeof window === "undefined") return
  try {
    if (bypassed) {
      localStorage.setItem(VERIFICATION_TESTING_BYPASS_KEY, "true")
      localStorage.setItem(LEGACY_VERIFICATION_TESTING_BYPASS_KEY, "true")
    } else {
      localStorage.removeItem(VERIFICATION_TESTING_BYPASS_KEY)
      localStorage.removeItem(LEGACY_VERIFICATION_TESTING_BYPASS_KEY)
    }
    window.dispatchEvent(
      new CustomEvent("wanes:verification-status-changed", {
        detail: { bypassed },
      })
    )
    window.dispatchEvent(
      new CustomEvent("nova:verification-status-changed", {
        detail: { bypassed },
      })
    )
  } catch {}
}

export const EGYPTIAN_GOVERNORATE_CODES: Record<
  string,
  { code: string; nameEn: string; nameAr: string }
> = {
  "01": { code: "01", nameEn: "Cairo", nameAr: "القاهرة" },
  "02": { code: "02", nameEn: "Alexandria", nameAr: "الإسكندرية" },
  "03": { code: "03", nameEn: "Port Said", nameAr: "بورسعيد" },
  "04": { code: "04", nameEn: "Suez", nameAr: "السويس" },
  "11": { code: "11", nameEn: "Damietta", nameAr: "دمياط" },
  "12": { code: "12", nameEn: "Dakahlia", nameAr: "الدقهلية" },
  "13": { code: "13", nameEn: "Ash Sharqia", nameAr: "الشرقية" },
  "14": { code: "14", nameEn: "Al Qalyubia", nameAr: "القليوبية" },
  "15": { code: "15", nameEn: "Kafr El Sheikh", nameAr: "كفر الشيخ" },
  "16": { code: "16", nameEn: "Al Gharbia", nameAr: "الغربية" },
  "17": { code: "17", nameEn: "Al Monufia", nameAr: "المنوفية" },
  "18": { code: "18", nameEn: "Al Beheira", nameAr: "البحيرة" },
  "19": { code: "19", nameEn: "Ismailia", nameAr: "الإسماعيلية" },
  "21": { code: "21", nameEn: "Giza", nameAr: "الجيزة" },
  "22": { code: "22", nameEn: "Beni Suef", nameAr: "بني سويف" },
  "23": { code: "23", nameEn: "Faiyum", nameAr: "الفيوم" },
  "24": { code: "24", nameEn: "Minya", nameAr: "المنيا" },
  "25": { code: "25", nameEn: "Asyut", nameAr: "أسيوط" },
  "26": { code: "26", nameEn: "Sohag", nameAr: "سوهاج" },
  "27": { code: "27", nameEn: "Qena", nameAr: "قنا" },
  "28": { code: "28", nameEn: "Aswan", nameAr: "أسوان" },
  "29": { code: "29", nameEn: "Luxor", nameAr: "الأقصر" },
  "31": { code: "31", nameEn: "Red Sea", nameAr: "البحر الأحمر" },
  "32": { code: "32", nameEn: "New Valley", nameAr: "الوادي الجديد" },
  "33": { code: "33", nameEn: "Matrouh", nameAr: "مطروح" },
  "34": { code: "34", nameEn: "North Sinai", nameAr: "شمال سيناء" },
  "35": { code: "35", nameEn: "South Sinai", nameAr: "جنوب سيناء" },
  "88": { code: "88", nameEn: "Born Abroad", nameAr: "مواليد خارج الجمهورية" },
}

export const EGYPTIAN_GOVERNORATES = Object.values(EGYPTIAN_GOVERNORATE_CODES).map(
  (g) => g.nameEn
)

export const EGYPTIAN_UNIVERSITIES = [
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "Mansoura University",
  "Helwan University",
  "Assiut University",
  "Zagazig University",
  "American University in Cairo (AUC)",
  "German University in Cairo (GUC)",
  "British University in Egypt (BUE)",
  "Misr International University (MIU)",
  "Future University in Egypt (FUE)",
  "Nile University",
  "Badr University in Cairo (BUC)",
  "Other Accredited University",
]

export function calculateEgyptianIdChecksum(first13Digits: string): number {
  const digits = first13Digits.split("").map(Number).reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return (10 - (sum % 10)) % 10
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function validateEgyptianNationalId(
  id: string,
  options?: { requireMinAge?: number; expectedGender?: "male" | "female" }
): { valid: boolean; reason?: string; info?: EgyptianNationalIdInfo } {
  const cleaned = id.replace(/[\s\-]/g, "").trim()
  const minAge = options?.requireMinAge ?? 18

  if (!cleaned) {
    return { valid: false, reason: "National ID number is required" }
  }

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, reason: "National ID must contain digits only" }
  }

  if (cleaned.length !== 14) {
    return {
      valid: false,
      reason: `National ID must be exactly 14 digits (currently ${cleaned.length} digits entered)`,
    }
  }

  const centuryDigit = parseInt(cleaned[0], 10)
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return {
      valid: false,
      reason: "Invalid century code: First digit must be 2 (born 1900-1999) or 3 (born 2000-2099)",
    }
  }

  const centuryYear = centuryDigit === 2 ? 1900 : 2000
  const yy = parseInt(cleaned.slice(1, 3), 10)
  const mm = parseInt(cleaned.slice(3, 5), 10)
  const dd = parseInt(cleaned.slice(5, 7), 10)
  const fullYear = centuryYear + yy

  if (mm < 1 || mm > 12) {
    return {
      valid: false,
      reason: `Invalid birth month '${cleaned.slice(3, 5)}' encoded in ID. Month must be between 01 and 12`,
    }
  }

  const daysInMonths = [
    31,
    isLeapYear(fullYear) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  const maxDay = daysInMonths[mm - 1]

  if (dd < 1 || dd > maxDay) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return {
      valid: false,
      reason: `Invalid calendar day '${dd}' for ${monthNames[mm - 1]} ${fullYear} (max ${maxDay} days)`,
    }
  }

  const today = new Date()
  const birthDateObj = new Date(fullYear, mm - 1, dd)
  if (birthDateObj > today) {
    return {
      valid: false,
      reason: "Birthdate encoded in National ID cannot be in the future",
    }
  }

  let calculatedAge = today.getFullYear() - fullYear
  const monthDiff = today.getMonth() - (mm - 1)
  const dayDiff = today.getDate() - dd
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    calculatedAge--
  }

  if (calculatedAge < minAge) {
    return {
      valid: false,
      reason: `National ID indicates age of ${calculatedAge} years. Platform helpers must be at least ${minAge} years old`,
    }
  }

  if (calculatedAge > 120) {
    return {
      valid: false,
      reason: `Calculated age of ${calculatedAge} years is outside valid limits`,
    }
  }

  const govCode = cleaned.slice(7, 9)
  const govInfo = EGYPTIAN_GOVERNORATE_CODES[govCode]
  if (!govInfo) {
    return {
      valid: false,
      reason: `Invalid Egyptian governorate code '${govCode}' encoded in ID. Must match an official Egyptian civil registry governorate code`,
    }
  }

  const genderDigit = parseInt(cleaned[12], 10)
  const gender: "male" | "female" = genderDigit % 2 !== 0 ? "male" : "female"

  if (options?.expectedGender && options.expectedGender !== gender) {
    return {
      valid: false,
      reason: `Gender mismatch: National ID is registered as ${gender.toUpperCase()} (digit 13: '${genderDigit}'), but profile selection is ${options.expectedGender.toUpperCase()}`,
    }
  }

  const first13 = cleaned.slice(0, 13)
  const actualCheckDigit = parseInt(cleaned[13], 10)
  const calculatedCheckDigit = calculateEgyptianIdChecksum(first13)

  if (actualCheckDigit !== calculatedCheckDigit) {
    return {
      valid: false,
      reason: `Checksum verification failed: 14th check digit mismatch (expected ${calculatedCheckDigit}, got ${actualCheckDigit}). Random or invalid National ID rejected`,
    }
  }

  const birthDateIso = `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
  const formattedId = `${cleaned[0]}-${cleaned.slice(1, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 13)}-${cleaned[13]}`

  const info: EgyptianNationalIdInfo = {
    valid: true,
    rawId: cleaned,
    formattedId,
    century: centuryYear,
    centuryLabel: centuryDigit === 2 ? "20th Century (1900-1999)" : "21st Century (2000-2099)",
    birthDate: birthDateIso,
    birthYear: fullYear,
    birthMonth: mm,
    birthDay: dd,
    age: calculatedAge,
    governorateCode: govCode,
    governorateName: govInfo.nameEn,
    governorateNameAr: govInfo.nameAr,
    gender,
    genderLabel: gender === "male" ? "Male" : "Female",
    genderLabelAr: gender === "male" ? "ذكر" : "أنثى",
    serialNumber: cleaned.slice(9, 13),
    calculatedCheckDigit,
    actualCheckDigit,
    checksumPassed: true,
  }

  return { valid: true, info }
}

export function validateEgyptianPhone(phone: string): { valid: boolean; reason?: string } {
  const cleaned = phone.replace(/[\s\-()]/g, "").trim()
  if (!cleaned) {
    return { valid: false, reason: "Phone number is required" }
  }
  if (/^(\+?20|0)?1[0125]\d{8}$/.test(cleaned)) {
    return { valid: true }
  }
  if (cleaned.length >= 8 && /^\+?\d+$/.test(cleaned)) {
    return { valid: true }
  }
  return { valid: false, reason: "Please enter a valid Egyptian phone number (e.g. 0100 000 0000)" }
}

export function getStoredHelperVerification(userId?: string): HelperVerificationData | null {
  if (!userId) return null
  try {
    const raw =
      localStorage.getItem(`${HELPER_STORAGE_PREFIX}${userId}`) ||
      localStorage.getItem(`${LEGACY_HELPER_STORAGE_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as HelperVerificationData
      if (!parsed.nationalIdFrontImage && parsed.nationalIdImage) {
        parsed.nationalIdFrontImage = parsed.nationalIdImage
      }
      return parsed
    }
  } catch {}
  return null
}

export function saveStoredHelperVerification(
  userId: string,
  data: HelperVerificationData,
  profileInfo?: {
    fullName?: string
    email?: string
    phone?: string
    role?: "volunteer" | "paid_companion"
    avatarUrl?: string
  }
): void {
  try {
    const val = JSON.stringify(data)
    localStorage.setItem(`${HELPER_STORAGE_PREFIX}${userId}`, val)
    localStorage.setItem(`${LEGACY_HELPER_STORAGE_PREFIX}${userId}`, val)
    updateGlobalApplicationRegistry(userId, data, profileInfo)
  } catch {}
}

export function getStoredClientVerification(userId?: string): ClientVerificationData | null {
  if (!userId) return null
  try {
    const raw =
      localStorage.getItem(`${CLIENT_STORAGE_PREFIX}${userId}`) ||
      localStorage.getItem(`${LEGACY_CLIENT_STORAGE_PREFIX}${userId}`)
    if (raw) return JSON.parse(raw) as ClientVerificationData
  } catch {}
  return null
}

export function saveStoredClientVerification(userId: string, data: ClientVerificationData): void {
  try {
    const val = JSON.stringify(data)
    localStorage.setItem(`${CLIENT_STORAGE_PREFIX}${userId}`, val)
    localStorage.setItem(`${LEGACY_CLIENT_STORAGE_PREFIX}${userId}`, val)
  } catch {}
}

export function updateGlobalApplicationRegistry(
  userId: string,
  verification: HelperVerificationData,
  profileInfo?: {
    fullName?: string
    email?: string
    phone?: string
    role?: "volunteer" | "paid_companion"
    avatarUrl?: string
  }
) {
  try {
    const all = getAllHelperVerifications()
    const index = all.findIndex((a) => a.userId === userId || a.id === `app_${userId}`)

    const applicantName =
      profileInfo?.fullName ||
      (index >= 0 ? all[index].fullName : "Applicant Provider")
    const applicantRole =
      profileInfo?.role || (index >= 0 ? all[index].role : "volunteer")

    const aiAnalysis = evaluateApplicationRuleBased(
      applicantName,
      verification,
      applicantRole
    )

    const updatedRecord: HelperVerificationRecord = {
      id:
        index >= 0
          ? all[index].id
          : `app_${userId.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 16)}`,
      userId,
      fullName: applicantName,
      email:
        profileInfo?.email ||
        (index >= 0 ? all[index].email : "applicant@wanes.org"),
      phone:
        profileInfo?.phone ||
        (index >= 0 ? all[index].phone : "+20 100 000 0000"),
      avatarUrl:
        profileInfo?.avatarUrl ||
        (index >= 0 ? all[index].avatarUrl : undefined),
      role: applicantRole,
      isRealSubmission: true,
      routedToAdmin: MASTER_ADMIN_EMAIL,
      submittedAt: verification.submittedAt || new Date().toISOString(),
      verification,
      aiAnalysis,
    }

    if (index >= 0) {
      all[index] = { ...all[index], ...updatedRecord }
    } else {
      all.unshift(updatedRecord)
    }

    const allSerialized = JSON.stringify(all)
    localStorage.setItem(ALL_APPLICATIONS_STORAGE_KEY, allSerialized)
    localStorage.setItem(LEGACY_ALL_APPLICATIONS_STORAGE_KEY, allSerialized)

    const adminQueueSerialized = JSON.stringify(all.filter((a) => a.isRealSubmission))
    localStorage.setItem(ADMIN_QUEUE_ROUTING_KEY, adminQueueSerialized)
    localStorage.setItem(LEGACY_ADMIN_QUEUE_ROUTING_KEY, adminQueueSerialized)

    window.dispatchEvent(
      new CustomEvent("wanes:new-verification-submitted", {
        detail: { record: updatedRecord },
      })
    )
    window.dispatchEvent(
      new CustomEvent("nova:new-verification-submitted", {
        detail: { record: updatedRecord },
      })
    )
    window.dispatchEvent(
      new CustomEvent("wanes:verification-status-changed", {
        detail: { userId, status: verification.status },
      })
    )
    window.dispatchEvent(
      new CustomEvent("nova:verification-status-changed", {
        detail: { userId, status: verification.status },
      })
    )
  } catch (err) {
    console.error("Failed to update admin application registry:", err)
  }
}

export function getAllHelperVerifications(): HelperVerificationRecord[] {
  try {
    const raw =
      localStorage.getItem(ALL_APPLICATIONS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_ALL_APPLICATIONS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as HelperVerificationRecord[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((app) => {
          if (!app.aiAnalysis) {
            app.aiAnalysis = evaluateApplicationRuleBased(
              app.fullName,
              app.verification,
              app.role
            )
          }
          return app
        })
      }
    }
  } catch {
  }
  return []
}

export function getRealWorldHelperSubmissions(): HelperVerificationRecord[] {
  return getAllHelperVerifications()
}

export function updateApplicationAIAnalysis(
  userId: string,
  aiAnalysis: AIVerificationAnalysis
) {
  try {
    const all = getAllHelperVerifications()
    const record = all.find((r) => r.userId === userId || r.id === userId)
    if (record) {
      record.aiAnalysis = aiAnalysis
      const serialized = JSON.stringify(all)
      localStorage.setItem(ALL_APPLICATIONS_STORAGE_KEY, serialized)
      localStorage.setItem(LEGACY_ALL_APPLICATIONS_STORAGE_KEY, serialized)
      window.dispatchEvent(
        new CustomEvent("wanes:verification-status-changed", {
          detail: { userId, status: record.verification.status },
        })
      )
      window.dispatchEvent(
        new CustomEvent("nova:verification-status-changed", {
          detail: { userId, status: record.verification.status },
        })
      )
    }
  } catch {}
}

export function isMasterAdmin(profileOrEmail?: Profile | string | null): boolean {
  if (!profileOrEmail) return false
  const target = typeof profileOrEmail === "string" ? profileOrEmail : profileOrEmail.email
  if (target) {
    const lower = target.toLowerCase().trim()
    if (lower === MASTER_ADMIN_EMAIL.toLowerCase() || lower === "admin@nova.care") return true
  }
  return typeof profileOrEmail === "object" && profileOrEmail.role === "admin"
}

export function updateHelperVerificationStatus(
  userId: string,
  newStatus: VerificationDocumentStatus,
  notes?: string,
  adminName = "Admin Verification Team"
): boolean {
  try {
    const all = getAllHelperVerifications()
    const record = all.find((r) => r.userId === userId || r.id === userId)
    if (!record) return false

    record.verification.status = newStatus
    record.verification.reviewedAt = new Date().toISOString()
    record.verification.reviewedBy = adminName
    if (newStatus === "rejected") {
      record.verification.rejectionReason =
        notes || "Documents failed safety compliance verification"
    } else if (newStatus === "approved") {
      record.verification.rejectionReason = undefined
    }

    const allSerialized = JSON.stringify(all)
    localStorage.setItem(ALL_APPLICATIONS_STORAGE_KEY, allSerialized)
    localStorage.setItem(LEGACY_ALL_APPLICATIONS_STORAGE_KEY, allSerialized)

    const targetUserId = record.userId
    const existing = getStoredHelperVerification(targetUserId)
    if (existing) {
      existing.status = newStatus
      existing.reviewedAt = record.verification.reviewedAt
      existing.reviewedBy = adminName
      existing.rejectionReason = record.verification.rejectionReason
      const val = JSON.stringify(existing)
      localStorage.setItem(`${HELPER_STORAGE_PREFIX}${targetUserId}`, val)
      localStorage.setItem(`${LEGACY_HELPER_STORAGE_PREFIX}${targetUserId}`, val)
    }

    window.dispatchEvent(
      new CustomEvent("wanes:verification-status-changed", {
        detail: { userId: targetUserId, status: newStatus, notes },
      })
    )
    window.dispatchEvent(
      new CustomEvent("nova:verification-status-changed", {
        detail: { userId: targetUserId, status: newStatus, notes },
      })
    )

    return true
  } catch {
    return false
  }
}

export function checkUserVerification(
  profile: Profile | null,
  _userMetadata?: any
): VerificationState {
  if (!profile) {
    return {
      isVerified: false,
      isProvider: false,
      status: "unsubmitted",
      missingRequirements: ["Account authentication required"],
      helperData: null,
      clientData: null,
    }
  }

  const isProvider = profile.role === "volunteer" || profile.role === "paid_companion"

  return {
    isVerified: true,
    isProvider,
    status: "approved",
    missingRequirements: [],
    helperData: profile.helper_verification || null,
    clientData: profile.client_verification || null,
  }
}
