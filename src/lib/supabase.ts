
import { createClient } from "@supabase/supabase-js"
import type {
  HelperVerificationData,
  ClientVerificationData,
} from "./verification"

const DEFAULT_SUPABASE_URL = "https://wsfcbccireklmjytyoxs.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZmNiY2NpcmVrbG1qeXR5b3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NzE4OTMsImV4cCI6MjEwMzI0Nzg5M30.QOUy5PXyxFGp7l7Lc3jNyXz-baZHJJXkFTLLR8i1K74"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase

export type ProfileRole =
  | "senior_requester"
  | "standard_requester"
  | "paid_companion"
  | "volunteer"
  | "admin"

export type Gender = "male" | "female"

export interface Profile {
  id: string
  full_name: string
  email?: string | null
  phone: string | null
  role: ProfileRole
  avatar_url: string | null
  age?: number | null
  gender?: Gender | null
  is_verified: boolean
  national_id_verified: boolean
  helper_verification?: HelperVerificationData | null
  client_verification?: ClientVerificationData | null
  address_text?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_name?: string | null
  rating: number
  senior_mode_preference: boolean
  created_at: string
}

export type RequestCategory =
  | "senior_care"
  | "daily_errands"
  | "tech_setup"
  | "mobility_assistance"
  | "emergency_sos"

export type RequestUrgency = "normal" | "high" | "critical"

export type RequestStatus =
  | "open"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled"

export interface AssistanceRequest {
  id: string
  requester_id: string
  requester_name?: string | null
  requester_gender?: Gender | null
  title: string
  category: RequestCategory
  description: string
  urgency: RequestUrgency
  status: RequestStatus
  location_text: string | null
  latitude: number | null
  longitude: number | null
  assigned_volunteer_id: string | null
  payout_amount?: number | null
  escrow_amount?: number | null
  is_paid?: boolean | null
  care_recipient_name?: string | null
  created_at: string
}

export interface CompanionWallet {
  available_balance: number
  escrow_in_transit: number
  total_earned: number
  currency: string
}

export interface VolunteerImpactLedger {
  id: string
  volunteer_id: string
  request_id: string
  hours_completed: number
  impact_points: number
  digital_badge: string | null
  signed_off_by_requester: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  related_request_id: string | null
  is_read: boolean
  created_at: string
}

export type PaymentMethod = "card" | "meeza" | "wallet" | "instapay"

export type PaymentStatus =
  | "pending"
  | "processing"
  | "held_in_escrow"
  | "released"
  | "declined"
  | "refunded"

export interface PaymobTransaction {
  id: string
  transaction_ref: string
  user_id: string
  request_id?: string | null
  plan_name: string
  amount: number
  currency: string
  escrow_amount: number
  platform_fee: number
  payment_method: PaymentMethod
  status: PaymentStatus
  created_at: string
}

export interface AIVoiceSession {
  id: string
  user_id?: string | null
  session_mode: "voice_call" | "text_chat"
  transcript?: string | null
  messages_count: number
  duration_seconds: number
  created_at: string
}
