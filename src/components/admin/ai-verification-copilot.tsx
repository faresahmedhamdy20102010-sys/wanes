import * as React from "react"
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bot,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  type HelperVerificationRecord,
  updateApplicationAIAnalysis,
} from "@/lib/verification"
import {
  analyzeApplicationWithRealAI,
  evaluateApplicationRuleBased,
  type AIVerificationAnalysis,
} from "@/lib/verification-ai"
import { toast } from "sonner"

interface AIVerificationCopilotProps {
  record: HelperVerificationRecord
  onApproveWithAI?: (record: HelperVerificationRecord) => void
  onRejectWithAI?: (record: HelperVerificationRecord, reason: string) => void
  compact?: boolean
}

export function AIVerificationCopilot({
  record,
  onApproveWithAI,
  onRejectWithAI,
  compact = false,
}: AIVerificationCopilotProps) {
  const [analysis, setAnalysis] = React.useState<AIVerificationAnalysis>(() => {
    return (
      record.aiAnalysis ||
      evaluateApplicationRuleBased(record.fullName, record.verification, record.role)
    )
  })
  const [isScanning, setIsScanning] = React.useState(false)

  React.useEffect(() => {
    if (record.aiAnalysis) {
      setAnalysis(record.aiAnalysis)
    } else {
      const fresh = evaluateApplicationRuleBased(
        record.fullName,
        record.verification,
        record.role
      )
      setAnalysis(fresh)
    }
  }, [record])

  async function handleLiveAIScan() {
    setIsScanning(true)
    toast.info("Connecting to AI Copilot (Gemini / OpenAI) for deep security audit...")
    try {
      const result = await analyzeApplicationWithRealAI(record)
      setAnalysis(result)
      updateApplicationAIAnalysis(record.userId, result)
      toast.success(`AI Security Audit Complete (${result.modelUsed})`)
    } catch {
      toast.error("AI deep audit failed, fallback engine maintained.")
    } finally {
      setIsScanning(false)
    }
  }

  const isSafe = analysis.recommendation === "SAFE_TO_APPROVE"
  const isFlagged = analysis.recommendation === "FLAGGED_REVIEW_REQUIRED"

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={`text-[10px] font-bold py-0.5 px-2.5 flex items-center gap-1 border shadow-sm ${
            isSafe
              ? "bg-[#059669]/15 text-[#059669] border-[#059669]/30"
              : isFlagged
              ? "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30"
              : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
          }`}
        >
          <Sparkles className="size-3 shrink-0" />
          <span>
            {isSafe
              ? `AI: Safe to Approve (${analysis.trustScore}%)`
              : isFlagged
              ? `AI: Flagged - Review ID (${analysis.trustScore}%)`
              : `AI: High Risk - Reject (${analysis.trustScore}%)`}
          </span>
        </Badge>

        <span className="text-[10px] text-[#94A3B8] truncate max-w-xs">
          {analysis.recommendationHeadline}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#1E293B] p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 shadow-inner">
            <Bot className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-[#F8FAFC] flex items-center gap-1.5">
                <span>AI eKYC Verification Copilot</span>
                <span className="size-2 rounded-full bg-[#3B82F6] animate-pulse" />
              </h4>
              <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 text-[9px] uppercase tracking-wider">
                {analysis.modelUsed}
              </Badge>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Automated fraud detection, National ID mathematical audit, and document validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isScanning}
            onClick={handleLiveAIScan}
            className="border-[#3B82F6]/30 bg-[#3B82F6]/10 text-xs text-[#3B82F6] hover:text-[#F8FAFC] hover:bg-[#3B82F6]/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3 mr-1.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning with AI..." : "Re-Scan with Live LLM"}
          </Button>
        </div>
      </div>

      <div
        className={`rounded-xl p-3.5 border flex items-start gap-3 transition-all ${
          isSafe
            ? "border-[#059669]/40 bg-[#059669]/10 text-emerald-200"
            : isFlagged
            ? "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-blue-200"
            : "border-[#EF4444]/40 bg-[#EF4444]/10 text-red-200"
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isSafe ? (
            <CheckCircle2 className="size-5 text-[#059669]" />
          ) : isFlagged ? (
            <AlertTriangle className="size-5 text-[#3B82F6]" />
          ) : (
            <XCircle className="size-5 text-[#EF4444]" />
          )}
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="text-xs sm:text-sm font-black tracking-tight text-[#F8FAFC]">
              {analysis.recommendationHeadline}
            </h5>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">
                Trust Score:
              </span>
              <span
                className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg border ${
                  isSafe
                    ? "bg-[#059669]/20 text-[#059669] border-[#059669]/40"
                    : isFlagged
                    ? "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40"
                    : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40"
                }`}
              >
                {analysis.trustScore}%
              </span>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {analysis.recommendationExplanation}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-2.5 space-y-1">
          <span className="text-[10px] text-[#94A3B8] flex items-center justify-between">
            <span>National ID Math</span>
            <span
              className={`font-mono font-bold ${
                analysis.checksumVerified ? "text-[#059669]" : "text-[#EF4444]"
              }`}
            >
              {analysis.checksumVerified ? "Pass ✓" : "Fail ✗"}
            </span>
          </span>
          <p className="font-bold text-[#F8FAFC] text-xs truncate">
            {analysis.checksumVerified ? "Luhn Mod-10 Valid" : "Invalid Checksum"}
          </p>
          <span className="text-[10px] text-[#94A3B8] block truncate">
            Gov: {record.verification.decodedId?.governorateName || "Registry"}
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-2.5 space-y-1">
          <span className="text-[10px] text-[#94A3B8] flex items-center justify-between">
            <span>Age & 18+ Gate</span>
            <span
              className={`font-mono font-bold ${
                analysis.ageVerified ? "text-[#059669]" : "text-[#EF4444]"
              }`}
            >
              {analysis.ageVerified ? "Valid ✓" : "Underage ✗"}
            </span>
          </span>
          <p className="font-bold text-[#F8FAFC] text-xs">
            {analysis.calculatedAge} Years Old
          </p>
          <span className="text-[10px] text-[#94A3B8] block truncate">
            DOB: {record.verification.decodedId?.birthDate || "Civil Registry"}
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-2.5 space-y-1">
          <span className="text-[10px] text-[#94A3B8] flex items-center justify-between">
            <span>Document Set</span>
            <span
              className={`font-mono font-bold ${
                analysis.documentsComplete ? "text-[#059669]" : "text-[#3B82F6]"
              }`}
            >
              {analysis.documentsComplete ? "5/5 Complete" : "Missing Docs"}
            </span>
          </span>
          <p className="font-bold text-[#F8FAFC] text-xs">
            {analysis.documentsComplete ? "All 5 Uploaded" : "Check Missing"}
          </p>
          <span className="text-[10px] text-[#94A3B8] block truncate">
            ID, Uni, Police, Selfie
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-2.5 space-y-1">
          <span className="text-[10px] text-[#94A3B8] flex items-center justify-between">
            <span>Police Record</span>
            <span
              className={`font-mono font-bold ${
                analysis.policeRecordValid ? "text-[#059669]" : "text-[#3B82F6]"
              }`}
            >
              {analysis.policeRecordValid ? "Fresh ✓" : ">90 Days"}
            </span>
          </span>
          <p className="font-bold text-[#F8FAFC] text-xs truncate">
            {analysis.policeRecordAgeDays !== undefined
              ? `${analysis.policeRecordAgeDays} Days Old`
              : "Present"}
          </p>
          <span className="text-[10px] text-[#94A3B8] block truncate">
            {analysis.policeRecordValid ? "< 90 Days Valid" : "Expired Certificate"}
          </span>
        </div>
      </div>

      {analysis.flags.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#3B82F6]" />
              Detailed AI Findings ({analysis.flags.length})
            </span>
            <span className="text-[10px] text-[#94A3B8] font-mono">
              Audit Stamp: {new Date(analysis.analyzedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1.5">
            {analysis.flags.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs rounded-lg bg-[#1E293B] p-2 border border-white/[0.08]"
              >
                <span
                  className={`size-2 rounded-full mt-1.5 shrink-0 ${
                    flag.severity === "critical"
                      ? "bg-[#EF4444]"
                      : flag.severity === "high"
                      ? "bg-[#EF4444]/80"
                      : flag.severity === "medium"
                      ? "bg-[#3B82F6]"
                      : "bg-[#059669]"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#F8FAFC]">{flag.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                        flag.severity === "critical"
                          ? "bg-[#EF4444]/20 text-[#EF4444]"
                          : flag.severity === "high"
                          ? "bg-[#EF4444]/20 text-[#EF4444]"
                          : flag.severity === "medium"
                          ? "bg-[#3B82F6]/20 text-[#3B82F6]"
                          : "bg-[#059669]/20 text-[#059669]"
                      }`}
                    >
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08]">
        <span className="text-[11px] text-[#94A3B8]">
          Admin Action Recommendation:{" "}
          <strong
            className={`capitalize ${
              isSafe ? "text-[#059669]" : isFlagged ? "text-[#3B82F6]" : "text-[#EF4444]"
            }`}
          >
            {analysis.suggestedAction === "approve"
              ? "Safe to Approve"
              : analysis.suggestedAction === "reject"
              ? "Recommended Reject"
              : "Manual Inspection Required"}
          </strong>
        </span>

        <div className="flex items-center gap-2">
          {onRejectWithAI && !isSafe && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onRejectWithAI(
                  record,
                  analysis.suggestedRejectReason || analysis.recommendationExplanation
                )
              }
              className="border-[#EF4444]/30 bg-[#EF4444]/10 hover:bg-[#DC2626]/20 text-[#EF4444] text-xs font-semibold"
            >
              <XCircle className="size-3.5 mr-1 text-[#EF4444]" />
              Reject with AI Findings
            </Button>
          )}

          {onApproveWithAI && (
            <Button
              size="sm"
              onClick={() => onApproveWithAI(record)}
              className="bg-[#059669] hover:bg-[#059669]/90 text-white text-xs font-bold shadow-md shadow-[#059669]/20 cursor-pointer"
            >
              <Zap className="size-3.5 mr-1" />
              Approve with AI Sign-Off
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
