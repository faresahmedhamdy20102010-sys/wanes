import { z } from "zod"
import { validateEgyptianPhone } from "./verification"
import type { ProfileRole, Gender } from "./supabase"

export const signInSchema = z.object({
  email: z
    .string({ message: "This field is required" })
    .trim()
    .min(1, "This field is required")
    .email("Please enter a valid email address (e.g. user@example.com)"),
  password: z
    .string({ message: "This field is required" })
    .min(1, "This field is required"),
})

export type SignInFormData = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  fullName: z
    .string({ message: "This field is required" })
    .trim()
    .min(1, "This field is required")
    .min(2, "Full legal name must be at least 2 characters"),
  email: z
    .string({ message: "This field is required" })
    .trim()
    .min(1, "This field is required")
    .email("Please enter a valid email address (e.g. user@example.com)"),
  password: z
    .string({ message: "This field is required" })
    .min(1, "This field is required")
    .min(6, "Password must be at least 6 characters"),
  phone: z
    .string({ message: "This field is required" })
    .trim()
    .min(1, "This field is required")
    .refine(
      (val) => {
        if (!val.trim()) return false
        const check = validateEgyptianPhone(val)
        return check.valid
      },
      {
        message: "Please enter a valid Egyptian phone number (e.g. 010 1234 5678)",
      }
    ),
  age: z
    .string({ message: "This field is required" })
    .trim()
    .min(1, "This field is required")
    .refine(
      (val) => {
        const num = Number(val)
        return !isNaN(num) && num >= 18 && num <= 120
      },
      {
        message: "Please enter a valid age between 18 and 120 years",
      }
    ),
  gender: z.enum(["male", "female"], {
    message: "This field is required",
  }),
  userType: z.enum(["client", "provider"], {
    message: "This field is required",
  }),
  role: z.enum(["standard_requester", "senior_requester", "volunteer", "paid_companion"], {
    message: "This field is required",
  }),
})

export type SignUpFormData = z.infer<typeof signUpSchema>

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path[0] as string
    if (field && !result[field]) {
      result[field] = issue.message
    }
  }
  return result
}

export function validateSignIn(data: { email: string; password: string }): {
  success: boolean
  errors: Record<string, string>
  data?: SignInFormData
} {
  const result = signInSchema.safeParse(data)
  if (result.success) {
    return { success: true, errors: {}, data: result.data }
  }
  return { success: false, errors: formatZodErrors(result.error) }
}

export function validateSignUp(data: {
  fullName: string
  email: string
  password: string
  phone: string
  age: string
  gender: Gender | "" | undefined
  userType: "client" | "provider" | "" | undefined
  role: ProfileRole | "" | undefined
}): {
  success: boolean
  errors: Record<string, string>
  data?: SignUpFormData
} {
  const result = signUpSchema.safeParse(data)
  if (result.success) {
    return { success: true, errors: {}, data: result.data }
  }
  return { success: false, errors: formatZodErrors(result.error) }
}
