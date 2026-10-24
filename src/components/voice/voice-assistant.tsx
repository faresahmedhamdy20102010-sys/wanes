import * as React from "react"
import { Mic, Volume2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { toast } from "sonner"

type VoiceAssistantProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onParsedRequest: (data: {
    title: string
    category: RequestCategory
    urgency: RequestUrgency
    description: string
  }) => void
}

type ParsedRequest = {
  title: string
  category: RequestCategory
  urgency: RequestUrgency
  description: string
}

function parseTranscript(transcript: string): ParsedRequest {
  const lower = transcript.toLowerCase()

  let category: RequestCategory = "daily_errands"
  if (lower.includes("senior") || lower.includes("elder") || lower.includes("grandparent")) {
    category = "senior_care"
  } else if (lower.includes("grocery") || lower.includes("errand") || lower.includes("shopping") || lower.includes("pharmacy")) {
    category = "daily_errands"
  } else if (lower.includes("tech") || lower.includes("computer") || lower.includes("phone") || lower.includes("internet")) {
    category = "tech_setup"
  } else if (lower.includes("mobility") || lower.includes("wheelchair") || lower.includes("walk") || lower.includes("transport")) {
    category = "mobility_assistance"
  } else if (lower.includes("emergency") || lower.includes("sos") || lower.includes("urgent")) {
    category = "emergency_sos"
  }

  let urgency: RequestUrgency = "normal"
  if (lower.includes("critical") || lower.includes("emergency") || lower.includes("sos")) {
    urgency = "critical"
  } else if (lower.includes("urgent") || lower.includes("asap") || lower.includes("high")) {
    urgency = "high"
  }

  const title = transcript.length > 60 ? transcript.slice(0, 57) + "..." : transcript
  const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1)

  return {
    title: cleanTitle,
    category,
    urgency,
    description: transcript,
  }
}

function speak(text: string) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
}

export function VoiceAssistant({ open, onOpenChange, onParsedRequest }: VoiceAssistantProps) {
  const [listening, setListening] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const recognitionRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!open) {
      stopListening()
      setTranscript("")
      setListening(false)
      setProcessing(false)
    }
  }, [open])

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error("Voice recognition is not supported in this browser. Try Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setListening(true)
      setTranscript("")
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        setTranscript(final)
      } else if (interim) {
        setTranscript(interim)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.")
      } else {
        toast.error(`Voice recognition error: ${event.error}`)
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
      }
    }
    setListening(false)
  }

  function handleProcess() {
    if (!transcript.trim()) {
      toast.error("Please speak your request first.")
      return
    }

    setProcessing(true)
    const parsed = parseTranscript(transcript)

    speak(`Captured: ${parsed.title}. Category: ${parsed.category.replace(/_/g, " ")}. Confirming request.`)

    setTimeout(() => {
      setProcessing(false)
      onParsedRequest(parsed)
      onOpenChange(false)
      toast.success("Request details populated from voice input.")
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-[#1E293B]/95 backdrop-blur-2xl text-[#F8FAFC] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <Volume2 className="size-5 text-[#3B82F6]" />
            Voice Request Input
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Dictate your visit requirements to populate the service request form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex size-24 items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
              listening
                ? "bg-[#3B82F6] text-white shadow-[0_0_16px_rgba(59,130,246,0.25)] animate-pulse"
                : "bg-[#0F172A] border-2 border-[#3B82F6]/40 text-[#3B82F6] hover:border-[#3B82F6] hover:bg-[#3B82F6]/10"
            }`}
            aria-label={listening ? "Stop listening" : "Start voice input"}
          >
            {processing ? (
              <Loader2 className="size-8 animate-spin" />
            ) : (
              <Mic className="size-8" />
            )}
          </button>

          {listening && (
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#3B82F6] animate-bounce"
                  style={{ height: "16px", animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}

          <p className="text-sm text-[#94A3B8] text-center">
            {processing
              ? "Processing your request..."
              : listening
                ? "Listening... speak now"
                : transcript
                  ? "Tap the microphone to try again, or confirm below"
                  : "Tap the microphone and speak your request"}
          </p>

          {transcript && (
            <div className="w-full rounded-xl border border-white/[0.08] bg-[#0F172A]/80 p-4">
              <p className="text-sm font-medium text-[#F8FAFC]">{transcript}</p>
            </div>
          )}

          {transcript && !processing && (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]"
                onClick={() => setTranscript("")}
              >
                Clear
              </Button>
              <Button
                className="flex-1 bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-md shadow-[#3B82F6]/20 font-bold"
                onClick={handleProcess}
              >
                Confirm & Submit
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
