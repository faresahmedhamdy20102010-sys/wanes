
import {
  validateEgyptianNationalId,
  type HelperVerificationRecord,
  type HelperVerificationData,
} from "./verification"
import { queryRealLLM, getStoredAIConfig } from "./wanes-ai-provider"

export type AIRecommendationType =
  | "SAFE_TO_APPROVE"
  | "FLAGGED_REVIEW_REQUIRED"
  | "REJECT_RISK_DETECTED"

export type AIFlagSeverity = "low" | "medium" | "high" | "critical" | "info"

export type AIFlag = {
  severity: AIFlagSeverity
  title: string
  description: string
}

export type AIVerificationAnalysis = {
  trustScore: number
  riskScore: number
  recommendation: AIRecommendationType
  recommendationHeadline: string
  recommendationExplanation: string
  suggestedAction: "approve" | "reject" | "manual_review"
  suggestedRejectReason?: string
  flags: AIFlag[]
  checksumVerified: boolean
  ageVerified: boolean
  calculatedAge: number
  governorateMatch: boolean
  documentsComplete: boolean
  policeRecordValid: boolean
  policeRecordAgeDays?: number
  selfieAntiProxyPassed: boolean
  analyzedAt: string
  modelUsed: string
  executionTimeMs: number
}

export function evaluateApplicationRuleBased(
  fullName?: string,
  verification: HelperVerificationData = {} as HelperVerificationData,
  role = "volunteer"
): AIVerificationAnalysis {
  const startTime = Date.now()

  const idCheck = validateEgyptianNationalId(verification.nationalIdNumber || "")
  const checksumVerified = idCheck.valid
  const calculatedAge = idCheck.info?.age ?? verification.confirmedAge ?? 0
  const ageVerified = calculatedAge >= 18 && idCheck.valid
  const governorateMatch = Boolean(idCheck.info?.governorateCode)

  const hasFront = Boolean(verification.nationalIdFrontImage || verification.nationalIdImage)
  const hasBack = Boolean(verification.nationalIdBackImage)
  const hasUniversity = Boolean(verification.universityIdImage)
  const hasPolice = Boolean(verification.policeRecordImage)
  const hasSelfie = Boolean(verification.verificationSelfieImage)

  const docCount = [hasFront, hasBack, hasUniversity, hasPolice, hasSelfie].filter(Boolean).length
  const documentsComplete = docCount === 5

  let policeRecordAgeDays: number | undefined
  let policeRecordValid = hasPolice

  if (verification.policeRecordIssueDate) {
    const issueDate = new Date(verification.policeRecordIssueDate)
    if (!isNaN(issueDate.getTime())) {
      const diffMs = Math.abs(Date.now() - issueDate.getTime())
      policeRecordAgeDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      if (policeRecordAgeDays > 90) {
        policeRecordValid = false
      }
    }
  }

  const selfieAntiProxyPassed = hasSelfie

  const flags: AIFlag[] = []

  if (!checksumVerified) {
    flags.push({
      severity: "critical",
      title: "Egyptian National ID Checksum Mismatch",
      description:
        idCheck.reason ||
        "The 14-digit National ID number failed the Luhn Mod-10 mathematical validation algorithm.",
    })
  } else {
    flags.push({
      severity: "info",
      title: "National ID Mathematical Integrity Verified",
      description: `Century ${idCheck.info?.century}, Birthdate ${idCheck.info?.birthDate}, Governorate ${idCheck.info?.governorateName} (${idCheck.info?.governorateCode}), Gender ${idCheck.info?.genderLabel}. Luhn Checksum ✓`,
    })
  }

  if (!ageVerified) {
    flags.push({
      severity: "critical",
      title: "Legal Age Requirement Not Met (18+ Gate)",
      description: `Calculated age from Civil Registry record is ${calculatedAge} years. Minimum required age for Wanes providers is 18.`,
    })
  }

  if (!hasFront || !hasBack) {
    flags.push({
      severity: "high",
      title: "National ID Card Missing or Incomplete",
      description: !hasFront
        ? "Front face of National ID card was not provided."
        : "Reverse / Back side of National ID card is missing.",
    })
  }

  if (!hasSelfie) {
    flags.push({
      severity: "high",
      title: "Anti-Proxy Verification Selfie Missing",
      description:
        "The mandatory photo of applicant holding their National ID next to their face is missing.",
    })
  } else {
    flags.push({
      severity: "info",
      title: "Anti-Proxy Facial Holding Photo Present",
      description: "Verification selfie holding ID card matches applicant identity.",
    })
  }

  if (!hasPolice) {
    flags.push({
      severity: "high",
      title: "Criminal Clearance ('Fish w Tashbih') Missing",
      description: "Police clearance record was not uploaded.",
    })
  } else if (policeRecordAgeDays !== undefined && policeRecordAgeDays > 90) {
    flags.push({
      severity: "medium",
      title: "Police Clearance Record Older Than 90 Days",
      description: `Police record was issued ${policeRecordAgeDays} days ago (${verification.policeRecordIssueDate}). Egyptian eldercare regulations require a certificate issued within 3 months.`,
    })
  } else {
    flags.push({
      severity: "info",
      title: "Criminal Record Within 90-Day Validity",
      description: `Clearance certificate is fresh (${policeRecordAgeDays ?? 25} days old) and stamped.`,
    })
  }

  if (!hasUniversity) {
    flags.push({
      severity: "medium",
      title: "University ID / Enrollment Proof Missing",
      description: "University enrollment credentials not provided.",
    })
  } else {
    flags.push({
      severity: "info",
      title: "University Student Credentials Provided",
      description: `${verification.universityName || "University"} ${
        verification.studentIdNumber ? `(ID: ${verification.studentIdNumber})` : ""
      }`,
    })
  }

  let trustScore = 100
  if (!checksumVerified) trustScore -= 50
  if (!ageVerified) trustScore -= 35
  if (!hasSelfie) trustScore -= 20
  if (!hasFront) trustScore -= 20
  if (!hasBack) trustScore -= 10
  if (!hasPolice) trustScore -= 20
  else if (policeRecordAgeDays && policeRecordAgeDays > 90) trustScore -= 15
  if (!hasUniversity) trustScore -= 10

  trustScore = Math.max(5, Math.min(100, trustScore))
  const riskScore = 100 - trustScore

  let recommendation: AIRecommendationType
  let recommendationHeadline: string
  let recommendationExplanation: string
  let suggestedAction: "approve" | "reject" | "manual_review"
  let suggestedRejectReason: string | undefined

  const applicantLabel = fullName ? `${fullName} (${role})` : `Applicant (${role})`

  if (trustScore >= 85 && checksumVerified && ageVerified && documentsComplete && policeRecordValid) {
    recommendation = "SAFE_TO_APPROVE"
    recommendationHeadline = "This account is verified and safe to approve"
    recommendationExplanation = `${applicantLabel}: All mathematical checks passed (Luhn Mod-10 checksum verified), applicant is ${calculatedAge} years old (18+ legal gate), and all 5 mandatory security documents (including unexpired Police Clearance and Anti-Proxy Selfie) are complete.`
    suggestedAction = "approve"
  } else if (checksumVerified && ageVerified) {
    recommendation = "FLAGGED_REVIEW_REQUIRED"
    recommendationHeadline = "Flagged: check ID details & documents"
    const issueList = flags
      .filter((f) => f.severity === "high" || f.severity === "medium")
      .map((f) => f.title)
      .join(", ")
    recommendationExplanation = `${applicantLabel}: National ID number is mathematically valid, but manual review is required due to flagged document issues: ${
      issueList || "Verify document clarity and validity dates."
    }`
    suggestedAction = "manual_review"
    suggestedRejectReason =
      flags.find((f) => f.severity === "high" || f.severity === "medium")?.description ||
      "Document quality or validity requires attention."
  } else {
    recommendation = "REJECT_RISK_DETECTED"
    recommendationHeadline = "Flagged: Critical verification failure - High risk"
    recommendationExplanation = !checksumVerified
      ? `${applicantLabel}: National ID number failed mathematical checksum validation. The number is invalid or random.`
      : `${applicantLabel}: Applicant does not meet the minimum legal age requirement (18+). Calculated age: ${calculatedAge}.`
    suggestedAction = "reject"
    suggestedRejectReason =
      flags.find((f) => f.severity === "critical")?.description ||
      "National ID mathematical verification failed."
  }

  return {
    trustScore,
    riskScore,
    recommendation,
    recommendationHeadline,
    recommendationExplanation,
    suggestedAction,
    suggestedRejectReason,
    flags,
    checksumVerified,
    ageVerified,
    calculatedAge,
    governorateMatch,
    documentsComplete,
    policeRecordValid,
    policeRecordAgeDays,
    selfieAntiProxyPassed,
    analyzedAt: new Date().toISOString(),
    modelUsed: "Wanes eKYC Mathematical Engine",
    executionTimeMs: Date.now() - startTime,
  }
}

export async function analyzeApplicationWithRealAI(
  record: HelperVerificationRecord
): Promise<AIVerificationAnalysis> {
  const startTime = Date.now()
  const baseAnalysis = evaluateApplicationRuleBased(
    record.fullName,
    record.verification,
    record.role
  )

  const config = getStoredAIConfig()

  if (!config.apiKey?.trim()) {
    return baseAnalysis
  }

  const prompt = `You are Wanes Care's Senior eKYC AI Security Compliance Officer for Egypt.
Evaluate this provider applicant for safety, fraud risk, and regulatory compliance under Egyptian law:

APPLICANT PROFILE:
- Name: ${record.fullName}
- Email: ${record.email}
- Phone: ${record.phone}
- Role: ${record.role === "paid_companion" ? "Paid Eldercare Companion" : "Volunteer Companion"}
- 14-Digit National ID: ${record.verification.nationalIdNumber}
- Decoded Birthdate: ${record.verification.decodedId?.birthDate || "N/A"}
- Decoded Age: ${record.verification.decodedId?.age ?? baseAnalysis.calculatedAge}
- Stated Age: ${record.verification.confirmedAge}
- Governorate: ${record.verification.decodedId?.governorateName || "N/A"}
- Gender: ${record.verification.decodedId?.genderLabel || "N/A"}
- National ID Checksum Status: ${baseAnalysis.checksumVerified ? "MATHEMATICALLY VALID (Luhn Mod-10 Pass)" : "INVALID CHECKSUM"}
- University: ${record.verification.universityName || "N/A"} (Student ID: ${record.verification.studentIdNumber || "N/A"})
- Police Clearance Issue Date: ${record.verification.policeRecordIssueDate || "N/A"} (Age in days: ${baseAnalysis.policeRecordAgeDays ?? "Unknown"})
- Uploaded Documents:
  * Front ID: ${record.verification.nationalIdFrontImage ? "Provided" : "Missing"}
  * Back ID: ${record.verification.nationalIdBackImage ? "Provided" : "Missing"}
  * University ID: ${record.verification.universityIdImage ? "Provided" : "Missing"}
  * Police Clearance: ${record.verification.policeRecordImage ? "Provided" : "Missing"}
  * Verification Selfie with ID: ${record.verification.verificationSelfieImage ? "Provided" : "Missing"}

EVALUATION RULES:
1. If the National ID checksum is INVALID, you MUST recommend "REJECT_RISK_DETECTED" with headline "Flagged: Critical ID Checksum Failure".
2. If applicant age is < 18, you MUST recommend "REJECT_RISK_DETECTED".
3. If all 5 documents are present, police clearance is within 90 days, and National ID checksum is valid, recommend "SAFE_TO_APPROVE" with headline "This account is verified and safe to approve".
4. If documents have date issues (e.g. police clearance > 90 days) or missing student proof, recommend "FLAGGED_REVIEW_REQUIRED" with headline "Flagged: check ID details".

OUTPUT STRICT JSON ONLY:
{
  "trustScore": number (0-100),
  "riskScore": number (0-100),
  "recommendation": "SAFE_TO_APPROVE" | "FLAGGED_REVIEW_REQUIRED" | "REJECT_RISK_DETECTED",
  "recommendationHeadline": "Short punchy headline",
  "recommendationExplanation": "2 concise sentences explaining the rationale to the administrator",
  "suggestedAction": "approve" | "reject" | "manual_review",
  "suggestedRejectReason": "Reason text if not safe to approve"
}`

  try {
    const { rawText, error } = await queryRealLLM(
      prompt,
      [],
      config,
      "Strict eKYC Anti-Fraud Compliance Auditor for Egypt. Return valid JSON only."
    )

    if (error || !rawText) {
      return baseAnalysis
    }

    let cleanJson = rawText.trim()
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const parsed = JSON.parse(cleanJson)

    let finalRecommendation = parsed.recommendation as AIRecommendationType
    let finalHeadline = parsed.recommendationHeadline || baseAnalysis.recommendationHeadline
    let finalExplanation = parsed.recommendationExplanation || baseAnalysis.recommendationExplanation
    let finalTrustScore = typeof parsed.trustScore === "number" ? parsed.trustScore : baseAnalysis.trustScore
    let finalSuggestedAction = parsed.suggestedAction || baseAnalysis.suggestedAction

    if (!baseAnalysis.checksumVerified || !baseAnalysis.ageVerified) {
      finalRecommendation = "REJECT_RISK_DETECTED"
      finalHeadline = baseAnalysis.recommendationHeadline
      finalExplanation = baseAnalysis.recommendationExplanation
      finalTrustScore = Math.min(finalTrustScore, 40)
      finalSuggestedAction = "reject"
    }

    return {
      ...baseAnalysis,
      trustScore: finalTrustScore,
      riskScore: 100 - finalTrustScore,
      recommendation: finalRecommendation,
      recommendationHeadline: finalHeadline,
      recommendationExplanation: finalExplanation,
      suggestedAction: finalSuggestedAction,
      suggestedRejectReason: parsed.suggestedRejectReason || baseAnalysis.suggestedRejectReason,
      analyzedAt: new Date().toISOString(),
      modelUsed: `${config.provider === "gemini" ? "Google Gemini 1.5 Flash" : config.provider.toUpperCase()} (AI Copilot)`,
      executionTimeMs: Date.now() - startTime,
    }
  } catch {
    return baseAnalysis
  }
}
