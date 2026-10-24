
import * as React from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase, type Profile, type ProfileRole } from "@/lib/supabase"
import {
  checkUserVerification,
  getStoredHelperVerification,
  getStoredClientVerification,
  saveStoredHelperVerification,
  saveStoredClientVerification,
  isMasterAdmin,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_NAME,
  type HelperVerificationData,
  type ClientVerificationData,
  type VerificationDocumentStatus,
} from "@/lib/verification"

export interface ApplicantInfo {
  fullName?: string
  email?: string
  phone?: string
  role?: "volunteer" | "paid_companion"
  avatarUrl?: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isVerified: boolean
  verificationStatus: VerificationDocumentStatus | "unsubmitted"
  rejectionReason?: string
  missingRequirements: string[]
  isMasterAdmin: boolean
  becomeMasterAdmin: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: (force?: boolean) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  submitHelperVerification: (
    data: HelperVerificationData,
    applicantInfo?: ApplicantInfo
  ) => Promise<void>
  submitClientVerification: (data: ClientVerificationData) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

const PROFILE_STORAGE_KEY = "wanes_cached_profile"
const LEGACY_PROFILE_STORAGE_KEY = "nova_cached_profile"

const inMemoryProfileCache = new Map<string, Profile>()

function getCachedProfile(): Profile | null {
  try {
    const raw =
      sessionStorage.getItem(PROFILE_STORAGE_KEY) ||
      localStorage.getItem(PROFILE_STORAGE_KEY) ||
      sessionStorage.getItem(LEGACY_PROFILE_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Profile
    }
  } catch {
  }
  return null
}

function saveCachedProfile(profile: Profile | null): void {
  try {
    if (profile) {
      inMemoryProfileCache.set(profile.id, profile)
      const serialized = JSON.stringify(profile)
      sessionStorage.setItem(PROFILE_STORAGE_KEY, serialized)
      localStorage.setItem(PROFILE_STORAGE_KEY, serialized)
      sessionStorage.setItem(LEGACY_PROFILE_STORAGE_KEY, serialized)
      localStorage.setItem(LEGACY_PROFILE_STORAGE_KEY, serialized)
    } else {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY)
      localStorage.removeItem(PROFILE_STORAGE_KEY)
      sessionStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY)
      localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY)
    }
  } catch {
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(() => getCachedProfile())
  const [loading, setLoading] = React.useState(true)

  const isMountedRef = React.useRef(true)
  const sessionRef = React.useRef<Session | null>(null)
  sessionRef.current = session

  const fetchProfile = React.useCallback(
    async (userId: string, currentSession?: Session | null, forceRefresh = false) => {
      if (!forceRefresh && inMemoryProfileCache.has(userId)) {
        const cached = inMemoryProfileCache.get(userId)!
        if (isMountedRef.current) {
          setProfile(cached)
        }
        return cached
      }

      const activeUser = currentSession?.user || sessionRef.current?.user
      const fallbackName =
        activeUser?.user_metadata?.full_name ||
        activeUser?.email?.split("@")[0] ||
        "User"
      const fallbackEmail = activeUser?.email || null
      const fallbackRole =
        (activeUser?.user_metadata?.role as ProfileRole) || "standard_requester"
      const fallbackAge =
        activeUser?.user_metadata?.age !== undefined && activeUser?.user_metadata?.age !== null
          ? Number(activeUser.user_metadata.age)
          : null
      const fallbackGender = activeUser?.user_metadata?.gender || null
      const fallbackAvatar = activeUser?.user_metadata?.avatar_url || null

      const metaHelper = activeUser?.user_metadata?.helper_verification || getStoredHelperVerification(userId)
      const metaClient = activeUser?.user_metadata?.client_verification || getStoredClientVerification(userId)

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle()

        if (error) {
          console.warn("Profile fetch note:", error.message)
        }

        let resolvedProfile: Profile

        if (data) {
          resolvedProfile = {
            ...data,
            full_name: data.full_name || fallbackName,
            email: data.email || fallbackEmail,
            role: data.role || fallbackRole,
            phone: data.phone || activeUser?.phone || null,
            avatar_url: data.avatar_url || fallbackAvatar,
            age: data.age !== undefined && data.age !== null ? Number(data.age) : fallbackAge,
            gender: data.gender || fallbackGender,
            rating: typeof data.rating === "number" ? data.rating : 5.0,
            is_verified: Boolean(data.is_verified),
            national_id_verified: Boolean(data.national_id_verified),
            helper_verification: metaHelper || null,
            client_verification: metaClient || null,
            senior_mode_preference: Boolean(data.senior_mode_preference),
          } as Profile
        } else {
          resolvedProfile = {
            id: userId,
            full_name: fallbackName,
            email: fallbackEmail,
            phone: activeUser?.phone || null,
            role: fallbackRole,
            avatar_url: fallbackAvatar,
            age: fallbackAge,
            gender: fallbackGender,
            is_verified: false,
            national_id_verified: false,
            helper_verification: metaHelper || null,
            client_verification: metaClient || null,
            rating: 5.0,
            senior_mode_preference: false,
            created_at: new Date().toISOString(),
          }
        }

        const vCheck = checkUserVerification(resolvedProfile, activeUser?.user_metadata)
        resolvedProfile.is_verified = vCheck.isVerified
        resolvedProfile.national_id_verified = vCheck.isVerified || Boolean(resolvedProfile.national_id_verified)

        saveCachedProfile(resolvedProfile)

        if (isMountedRef.current) {
          setProfile(resolvedProfile)
        }
        return resolvedProfile
      } catch {
        const fallbackProfile: Profile = {
          id: userId,
          full_name: fallbackName,
          email: fallbackEmail,
          phone: activeUser?.phone || null,
          role: fallbackRole,
          avatar_url: fallbackAvatar,
          age: fallbackAge,
          gender: fallbackGender,
          is_verified: false,
          national_id_verified: false,
          helper_verification: metaHelper || null,
          client_verification: metaClient || null,
          rating: 5.0,
          senior_mode_preference: false,
          created_at: new Date().toISOString(),
        }

        const vCheck = checkUserVerification(fallbackProfile, activeUser?.user_metadata)
        fallbackProfile.is_verified = vCheck.isVerified
        fallbackProfile.national_id_verified = vCheck.isVerified

        saveCachedProfile(fallbackProfile)
        if (isMountedRef.current) {
          setProfile(fallbackProfile)
        }
        return fallbackProfile
      }
    },
    []
  )

  const refreshProfile = React.useCallback(
    async (force = true) => {
      const currentUserId = sessionRef.current?.user?.id
      if (currentUserId) {
        await fetchProfile(currentUserId, sessionRef.current, force)
      }
    },
    [fetchProfile]
  )

  const updateProfile = React.useCallback(
    async (updates: Partial<Profile>) => {
      const currentUserId = sessionRef.current?.user?.id
      if (!currentUserId) return
      setProfile((prev) => {
        const next = prev ? ({ ...prev, ...updates } as Profile) : null
        saveCachedProfile(next)
        return next
      })
      try {
        const dbUpdates: Record<string, unknown> = {
          id: currentUserId,
        }
        if ("full_name" in updates) dbUpdates.full_name = updates.full_name
        if ("email" in updates) dbUpdates.email = updates.email
        if ("phone" in updates) dbUpdates.phone = updates.phone
        if ("role" in updates) dbUpdates.role = updates.role
        if ("avatar_url" in updates) dbUpdates.avatar_url = updates.avatar_url
        if ("age" in updates) dbUpdates.age = updates.age
        if ("gender" in updates) dbUpdates.gender = updates.gender
        if ("is_verified" in updates) dbUpdates.is_verified = updates.is_verified
        if ("national_id_verified" in updates) dbUpdates.national_id_verified = updates.national_id_verified
        if ("senior_mode_preference" in updates) dbUpdates.senior_mode_preference = updates.senior_mode_preference

        await supabase.from("profiles").upsert(dbUpdates)
        await supabase.auth.updateUser({
          data: updates,
        })
      } catch (e) {
        console.warn("Profile sync error:", e)
      }
    },
    []
  )

  const becomeMasterAdmin = React.useCallback(async () => {
    const adminProfile: Profile = {
      id: "usr_master_admin_wanes",
      full_name: MASTER_ADMIN_NAME,
      email: MASTER_ADMIN_EMAIL,
      phone: "+20 100 000 0001",
      role: "admin",
      avatar_url:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256",
      rating: 5.0,
      is_verified: true,
      national_id_verified: true,
      senior_mode_preference: false,
      created_at: new Date().toISOString(),
    }
    saveCachedProfile(adminProfile)
    setProfile(adminProfile)
    inMemoryProfileCache.set(adminProfile.id, adminProfile)
  }, [])

  const submitHelperVerification = React.useCallback(
    async (
      data: HelperVerificationData,
      applicantInfo?: ApplicantInfo
    ) => {
      const currentUserId = sessionRef.current?.user?.id || profile?.id || "usr_applicant"
      const userMeta = sessionRef.current?.user?.user_metadata
      const resolvedInfo = {
        fullName:
          applicantInfo?.fullName ||
          profile?.full_name ||
          userMeta?.full_name ||
          "Applicant Provider",
        email:
          applicantInfo?.email ||
          profile?.email ||
          sessionRef.current?.user?.email ||
          "applicant@wanes.org",
        phone:
          applicantInfo?.phone ||
          profile?.phone ||
          userMeta?.phone ||
          "+20 100 000 0000",
        role: (applicantInfo?.role ||
          profile?.role ||
          userMeta?.role ||
          "volunteer") as "volunteer" | "paid_companion",
        avatarUrl:
          applicantInfo?.avatarUrl || profile?.avatar_url || userMeta?.avatar_url,
      }

      saveStoredHelperVerification(currentUserId, data, resolvedInfo)

      const isApproved = data.status === "approved"
      await updateProfile({
        is_verified: isApproved,
        national_id_verified: isApproved,
        age: data.confirmedAge,
        helper_verification: data,
      })
      await refreshProfile(true)
    },
    [updateProfile, refreshProfile, profile]
  )

  const submitClientVerification = React.useCallback(
    async (data: ClientVerificationData) => {
      const currentUserId = sessionRef.current?.user?.id
      if (!currentUserId) return

      const verifiedPayload: ClientVerificationData = {
        ...data,
        status: data.status ?? "approved",
      }

      saveStoredClientVerification(currentUserId, verifiedPayload)

      await updateProfile({
        is_verified: true,
        national_id_verified: true,
        phone: data.phone,
        address_text: `${data.streetAddress}, ${data.buildingApartment}, ${data.cityDistrict}, ${data.governorate}`,
        emergency_contact_phone: data.emergencyContactPhone,
        emergency_contact_name: data.emergencyContactName,
        client_verification: verifiedPayload,
      })
      await refreshProfile(true)
    },
    [updateProfile, refreshProfile]
  )

  React.useEffect(() => {
    isMountedRef.current = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMountedRef.current) return
      setSession(data.session)
      sessionRef.current = data.session

      if (data.session?.user?.id) {
        fetchProfile(data.session.user.id, data.session, false).finally(() => {
          if (isMountedRef.current) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMountedRef.current) return
      setSession(newSession)
      sessionRef.current = newSession

      if (newSession?.user?.id) {
        fetchProfile(newSession.user.id, newSession, false)
      } else {
        setProfile(null)
        saveCachedProfile(null)
      }
    })

    const handleVerificationChange = (e: Event) => {
      const detail = (e as CustomEvent<{ userId?: string }>).detail
      const targetId = detail?.userId
      if (!targetId || targetId === sessionRef.current?.user?.id) {
        if (sessionRef.current?.user?.id) {
          fetchProfile(sessionRef.current.user.id, sessionRef.current, true)
        }
      }
    }
    window.addEventListener("wanes:verification-status-changed", handleVerificationChange)
    window.addEventListener("nova:verification-status-changed", handleVerificationChange)

    return () => {
      isMountedRef.current = false
      listener.subscription.unsubscribe()
      window.removeEventListener("wanes:verification-status-changed", handleVerificationChange)
      window.removeEventListener("nova:verification-status-changed", handleVerificationChange)
    }
  }, [fetchProfile])

  const signOut = React.useCallback(async () => {
    inMemoryProfileCache.clear()
    saveCachedProfile(null)
    setProfile(null)
    setSession(null)
    sessionRef.current = null
    await supabase.auth.signOut()
  }, [])

  const user = session?.user ?? null

  const verificationState = React.useMemo(() => {
    return checkUserVerification(profile, session?.user?.user_metadata)
  }, [profile, session])

  const adminAuthorized = React.useMemo(() => {
    return isMasterAdmin(profile)
  }, [profile])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      isVerified: verificationState.isVerified,
      verificationStatus: verificationState.status,
      rejectionReason: verificationState.rejectionReason,
      missingRequirements: verificationState.missingRequirements,
      isMasterAdmin: adminAuthorized,
      becomeMasterAdmin,
      signOut,
      refreshProfile,
      updateProfile,
      submitHelperVerification,
      submitClientVerification,
    }),
    [
      user,
      session,
      profile,
      loading,
      verificationState.isVerified,
      verificationState.status,
      verificationState.rejectionReason,
      verificationState.missingRequirements,
      adminAuthorized,
      becomeMasterAdmin,
      signOut,
      refreshProfile,
      updateProfile,
      submitHelperVerification,
      submitClientVerification,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
