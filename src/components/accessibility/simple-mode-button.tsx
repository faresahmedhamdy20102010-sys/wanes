import { UniversalAccessIcon } from "@/components/accessibility/universal-access-icon"
import { useSimpleMode } from "@/lib/simple-mode"

export interface SimpleModeButtonProps {
  variant?: "navbar" | "sidebar" | "mobile" | "floating"
  className?: string
}

export function SimpleModeButton({
  variant = "navbar",
  className = "",
}: SimpleModeButtonProps) {
  const { isSimpleMode, toggleSimpleMode } = useSimpleMode()

  if (variant === "mobile") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isSimpleMode}
        aria-label="Toggle Simple Mode"
        onClick={toggleSimpleMode}
        className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer backdrop-blur-md ${
          isSimpleMode
            ? "border-[#3B82F6]/60 bg-[#1E293B] shadow-[0_0_15px_rgba(59,130,246,0.18)]"
            : "border-white/[0.08] bg-[#1E293B]/80 hover:border-[#3B82F6]/30 hover:bg-[#1E293B]"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
              isSimpleMode
                ? "border-[#3B82F6]/50 bg-[#3B82F6]/20 text-[#3B82F6]"
                : "border-white/[0.08] bg-white/[0.03] text-[#94A3B8]"
            }`}
          >
            <UniversalAccessIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#F8FAFC] block">
                Simple Mode
              </span>
              {isSimpleMode && (
                <span className="rounded-full bg-[#3B82F6] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <span className="text-xs text-[#94A3B8]">
              {isSimpleMode
                ? "Unified 125% zoom & high contrast active"
                : "One-click senior text size & contrast"}
            </span>
          </div>
        </div>

        <div
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ${
            isSimpleMode
              ? "border-[#3B82F6] bg-[#3B82F6]"
              : "border-white/10 bg-white/10"
          }`}
        >
          <span
            className={`inline-block size-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              isSimpleMode ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>
    )
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isSimpleMode}
        aria-label="Toggle Simple Mode"
        onClick={toggleSimpleMode}
        className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer group backdrop-blur-md ${
          isSimpleMode
            ? "border-[#3B82F6]/60 bg-[#3B82F6]/10 shadow-[0_0_12px_rgba(59,130,246,0.18)]"
            : "border-white/[0.08] bg-[#1E293B]/70 hover:border-[#3B82F6]/40 hover:bg-[#1E293B]"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              isSimpleMode
                ? "border-[#3B82F6]/60 bg-[#3B82F6]/25 text-[#3B82F6]"
                : "border-white/[0.08] bg-white/[0.03] text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:border-[#3B82F6]/30"
            }`}
          >
            <UniversalAccessIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#F8FAFC] truncate block group-hover:text-white">
                Simple Mode
              </span>
              {isSimpleMode && (
                <span className="rounded-full bg-[#3B82F6] px-1.5 py-0.2 text-[9px] font-bold text-white">
                  ON
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#94A3B8] truncate block">
              {isSimpleMode ? "Elder view active (125%)" : "One-click simplification"}
            </span>
          </div>
        </div>

        <div
          className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200 ${
            isSimpleMode
              ? "border-[#3B82F6] bg-[#3B82F6]"
              : "border-white/10 bg-white/10"
          }`}
        >
          <span
            className={`inline-block size-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              isSimpleMode ? "translate-x-3.5" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>
    )
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isSimpleMode}
        aria-label="Toggle Simple Mode"
        title={
          isSimpleMode
            ? "Simple Mode is active. Click to return to standard view."
            : "Click to enable Simple Mode (larger text, high contrast & simplified layout)"
        }
        onClick={toggleSimpleMode}
        className={`fixed right-4 bottom-5 z-40 flex h-11 items-center gap-2 rounded-full border px-3.5 shadow-xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-95 ${
          isSimpleMode
            ? "border-[#3B82F6] bg-[#1E293B] text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            : "border-white/[0.08] bg-[#1E293B]/90 text-[#94A3B8] hover:border-[#3B82F6]/50 hover:text-[#F8FAFC]"
        } ${className}`}
      >
        <UniversalAccessIcon
          size={18}
          className={`transition-colors ${
            isSimpleMode ? "text-[#3B82F6]" : "text-[#94A3B8]"
          }`}
        />
        <span className="text-xs font-semibold">Simple Mode</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            isSimpleMode ? "bg-[#3B82F6] text-white" : "bg-white/10 text-[#94A3B8]"
          }`}
        >
          {isSimpleMode ? "ON" : "OFF"}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isSimpleMode}
      aria-label="Toggle Simple Mode"
      title={
        isSimpleMode
          ? "Simple Mode is ON (125% zoom, high contrast). Click to turn OFF."
          : "Simple Mode: One-click larger text, high contrast & senior-friendly layout"
      }
      onClick={toggleSimpleMode}
      className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95 ${
        isSimpleMode
          ? "border-[#3B82F6] bg-[#1E293B] text-white shadow-[0_0_14px_rgba(59,130,246,0.3)] ring-1 ring-[#3B82F6]/40"
          : "border-white/[0.08] bg-[#1E293B]/80 text-[#94A3B8] hover:border-[#3B82F6]/40 hover:bg-[#1E293B] hover:text-[#F8FAFC]"
      } ${className}`}
    >
      <div
        className={`flex size-4 items-center justify-center transition-colors ${
          isSimpleMode ? "text-[#3B82F6]" : "text-[#94A3B8] group-hover:text-[#3B82F6]"
        }`}
      >
        <UniversalAccessIcon size={15} />
      </div>

      <span className="font-semibold tracking-tight text-[11px] select-none">
        Simple Mode
      </span>

      <div
        className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isSimpleMode ? "bg-[#3B82F6]" : "bg-white/15 group-hover:bg-white/25"
        }`}
      >
        <span
          className={`inline-block size-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
            isSimpleMode ? "translate-x-3" : "translate-x-0.5"
          }`}
        />
      </div>

      {isSimpleMode && (
        <span className="hidden sm:inline-flex rounded-full bg-[#3B82F6] px-1 py-0.2 text-[9px] font-extrabold text-white leading-none">
          ON
        </span>
      )}
    </button>
  )
}

export { SimpleModeButton as AccessibilityToolbarButton }
