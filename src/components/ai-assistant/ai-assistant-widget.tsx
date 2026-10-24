import * as React from "react"
import {
  Sparkles,
  X,
  Send,
  ShieldAlert,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Mic,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  Maximize2,
  Minimize2,
  CalendarPlus,
  Zap,
  FileText,
  Settings,
  Key,
  Cpu,
  Radio,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, type Route } from "@/lib/router"
import { useAuth } from "@/lib/auth-context"
import { supabase, type RequestCategory, type RequestUrgency } from "@/lib/supabase"
import { toast } from "sonner"
import {
  executeLLMCompanionTurn,
  enforceStrictEnglish,
  type ParsedIntent,
  type ConversationContext,
} from "@/lib/wanes-ai-brain"
import {
  getStoredAIConfig,
  saveStoredAIConfig,
  testLLMConnection,
  type AIProviderConfig,
  type AIProviderType,
} from "@/lib/wanes-ai-provider"
import { setPendingRequestIntent } from "@/lib/pending-request"
import { liveSync } from "@/lib/live-sync"
import { getStoredRecipients } from "@/components/dashboard/care-recipients-dialog"

export type AssistantActionCard =
  | {
      type: "order_draft"
      category: RequestCategory
      title: string
      description: string
      urgency: RequestUrgency
      recipientName?: string
      locationText?: string
      latitude?: number | null
      longitude?: number | null
      estimatedPrice: number
      escrowAmount: number
      isDeployed?: boolean
      deployedId?: string
    }
  | {
      type: "location_result"
      latitude: number
      longitude: number
      accuracy: number
      districtText: string
    }
  | {
      type: "form_dictation"
      fields: {
        name?: string
        phone?: string
        address?: string
        notes?: string
      }
    }
  | {
      type: "sos_card"
      reason?: string
    }

export type AssistantMessage = {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: Date
  card?: AssistantActionCard
  actionSuggestions?: {
    label: string
    action: string
    payload?: any
  }[]
}

export function AIAssistantWidget() {
  const [open, setOpen] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [messages, setMessages] = React.useState<AssistantMessage[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [deployingOrder, setDeployingOrder] = React.useState<string | null>(null)
  const [sosTriggering, setSosTriggering] = React.useState(false)

  const [activeDraft, setActiveDraft] = React.useState<Extract<AssistantActionCard, { type: "order_draft" }> | null>(null)

  const [isRecording, setIsRecording] = React.useState(false)
  const [liveTranscript, setLiveTranscript] = React.useState("")
  const [silenceCountdown, setSilenceCountdown] = React.useState<number | null>(null)
  const [speakingMessageId, setSpeakingMessageId] = React.useState<string | null>(null)
  const [autoVoiceEnabled, setAutoVoiceEnabled] = React.useState(true)
  const [handsFreeLoop, setHandsFreeLoop] = React.useState(true)

  const [aiConfig, setAiConfig] = React.useState<AIProviderConfig>(() => getStoredAIConfig())
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [tempApiKey, setTempApiKey] = React.useState("")
  const [tempProvider, setTempProvider] = React.useState<AIProviderType>(() => getStoredAIConfig().provider)
  const [tempModel, setTempModel] = React.useState("")
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [testingConnection, setTestingConnection] = React.useState(false)

  const { navigate } = useRouter()
  const { session, profile } = useAuth()
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const recognitionRef = React.useRef<any>(null)
  const silenceTimerRef = React.useRef<any>(null)
  const restartTimerRef = React.useRef<any>(null)
  const finalAccumulatedRef = React.useRef<string>("")
  const isSpeechSynthesizingRef = React.useRef<boolean>(false)
  const isRecordingRef = React.useRef<boolean>(false)
  const isProcessingRef = React.useRef<boolean>(false)
  const isSpeakingRef = React.useRef<boolean>(false)
  const currentSpeakingTextRef = React.useRef<string>("")
  const speechStartTimeRef = React.useRef<number>(0)
  const openRef = React.useRef<boolean>(open)
  const handsFreeLoopRef = React.useRef<boolean>(handsFreeLoop)
  const shouldListenRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    openRef.current = open
  }, [open])

  React.useEffect(() => {
    handsFreeLoopRef.current = handsFreeLoop
  }, [handsFreeLoop])

  React.useEffect(() => {
    setTempApiKey(aiConfig.apiKey || "")
    setTempProvider(aiConfig.provider)
    setTempModel(aiConfig.model || "")
  }, [aiConfig, settingsOpen])

  React.useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open, isTyping, liveTranscript])

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  React.useEffect(() => {
    if (!open) {
      stopListening()
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
    return () => {
      stopListening()
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [open])

  function interruptSpeaking(reason = "barge-in") {
    if (
      isSpeakingRef.current ||
      isSpeechSynthesizingRef.current ||
      (typeof window !== "undefined" && window.speechSynthesis?.speaking)
    ) {
      console.log(`[Wanes Barge-In] Shutting up audio output immediately: ${reason}`)
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      isSpeakingRef.current = false
      isSpeechSynthesizingRef.current = false
      setSpeakingMessageId(null)
      currentSpeakingTextRef.current = ""
    }
  }

  function sanitizeForSpeech(raw: string): string {
    return raw
      .replace(/[\u0600-\u06FF]/g, "")
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ""
      )
      .replace(/[*#_~`]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  function speakText(text: string, messageId: string, onEnded?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnded?.()
      return
    }

    if (speakingMessageId === messageId) {
      interruptSpeaking("User tapped speaking message button")
      return
    }

    shouldListenRef.current = false
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setSilenceCountdown(null)
    setLiveTranscript("")
    finalAccumulatedRef.current = ""

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
      } catch {}
    }
    isRecordingRef.current = false
    setIsRecording(false)

    window.speechSynthesis.cancel()
    const cleanText = sanitizeForSpeech(text)
    currentSpeakingTextRef.current = cleanText
    speechStartTimeRef.current = Date.now()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = "en-US"
    utterance.rate = 1.05
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const selectedVoice =
      voices.find((v) => v.lang === "en-US" && !v.name.includes("Zira")) ||
      voices.find((v) => v.lang.startsWith("en"))
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => {
      isSpeechSynthesizingRef.current = true
      isSpeakingRef.current = true
      setSpeakingMessageId(messageId)

      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
      isRecordingRef.current = false
      setIsRecording(false)
    }

    utterance.onend = () => {
      setSpeakingMessageId(null)

      setTimeout(() => {
        isSpeechSynthesizingRef.current = false
        isSpeakingRef.current = false
        currentSpeakingTextRef.current = ""

        const stillSpeaking =
          typeof window !== "undefined" && window.speechSynthesis?.speaking

        if (!stillSpeaking) {
          onEnded?.()
        }
      }, 400)
    }

    utterance.onerror = () => {
      setSpeakingMessageId(null)
      setTimeout(() => {
        isSpeechSynthesizingRef.current = false
        isSpeakingRef.current = false
        currentSpeakingTextRef.current = ""
        onEnded?.()
      }, 200)
    }

    isSpeechSynthesizingRef.current = true
    isSpeakingRef.current = true
    setSpeakingMessageId(messageId)

    window.speechSynthesis.speak(utterance)
  }

  function startListening(forceInterrupt = false) {
    if (forceInterrupt) {
      interruptSpeaking("Explicit startListening")
    }

    if (
      isSpeakingRef.current ||
      isSpeechSynthesizingRef.current ||
      (typeof window !== "undefined" && window.speechSynthesis?.speaking)
    ) {
      console.log("[Mic Mute Guard] Suppressed startListening: AI speech synthesis is active.")
      return
    }

    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRecognitionClass) {
      toast.error("Speech recognition is not supported in this browser. Please type your message.")
      return
    }

    shouldListenRef.current = true
    isProcessingRef.current = false

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }

    finalAccumulatedRef.current = ""
    setLiveTranscript("")
    setSilenceCountdown(null)

    try {
      const recognition = new SpeechRecognitionClass()
      recognitionRef.current = recognition
      recognition.lang = "en-US"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        if (
          isSpeakingRef.current ||
          isSpeechSynthesizingRef.current ||
          (typeof window !== "undefined" && window.speechSynthesis?.speaking)
        ) {
          try {
            recognition.abort()
          } catch {}
          isRecordingRef.current = false
          setIsRecording(false)
          return
        }
        isRecordingRef.current = true
        setIsRecording(true)
      }

      recognition.onspeechstart = () => {
        if (
          isSpeakingRef.current ||
          isSpeechSynthesizingRef.current ||
          (typeof window !== "undefined" && window.speechSynthesis?.speaking)
        ) {
          try {
            recognition.abort()
          } catch {}
          return
        }
      }

      recognition.onresult = (event: any) => {
        if (
          !shouldListenRef.current ||
          isSpeakingRef.current ||
          isSpeechSynthesizingRef.current ||
          (typeof window !== "undefined" && window.speechSynthesis?.speaking)
        ) {
          return
        }

        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalAccumulatedRef.current += (finalAccumulatedRef.current ? " " : "") + piece
          } else {
            interim += piece
          }
        }

        const currentStream = (finalAccumulatedRef.current ? finalAccumulatedRef.current + " " : "") + interim
        const cleanStream = currentStream.trim()

        if (cleanStream) {
          setLiveTranscript(cleanStream)
          setInputValue(cleanStream)

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          setSilenceCountdown(2.2)
          silenceTimerRef.current = setTimeout(() => {
            if (
              shouldListenRef.current &&
              !isSpeakingRef.current &&
              !isSpeechSynthesizingRef.current &&
              cleanStream.length > 0
            ) {
              handleCommitVoiceTurn(cleanStream)
            }
          }, 2200)
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition notice:", event.error)
        }
      }

      recognition.onend = () => {
        isRecordingRef.current = false
        setIsRecording(false)

        if (
          isSpeakingRef.current ||
          isSpeechSynthesizingRef.current ||
          (typeof window !== "undefined" && window.speechSynthesis?.speaking)
        ) {
          return
        }

        if (
          shouldListenRef.current &&
          !isProcessingRef.current &&
          openRef.current
        ) {
          restartTimerRef.current = setTimeout(() => {
            if (
              shouldListenRef.current &&
              !isProcessingRef.current &&
              !isSpeakingRef.current &&
              !isSpeechSynthesizingRef.current &&
              !(typeof window !== "undefined" && window.speechSynthesis?.speaking) &&
              openRef.current
            ) {
              try {
                recognition.start()
              } catch {
                if (shouldListenRef.current) {
                  startListening(false)
                }
              }
            }
          }, 250)
        }
      }

      recognition.start()
    } catch (err) {
      console.warn("Speech recognition initialization catch:", err)
      restartTimerRef.current = setTimeout(() => {
        if (
          shouldListenRef.current &&
          openRef.current &&
          !isSpeakingRef.current &&
          !isSpeechSynthesizingRef.current &&
          !(typeof window !== "undefined" && window.speechSynthesis?.speaking)
        ) {
          startListening(false)
        }
      }, 400)
    }
  }

  function stopListening() {
    shouldListenRef.current = false
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setSilenceCountdown(null)
    setLiveTranscript("")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    isRecordingRef.current = false
    setIsRecording(false)
  }

  function toggleRecording() {
    if (isSpeakingRef.current) {
      interruptSpeaking("User tapped mic button")
    }
    if (isRecording) {
      stopListening()
    } else {
      startListening(true)
    }
  }

  function handleCommitVoiceTurn(spokenSentence: string) {
    interruptSpeaking("Commit voice turn")
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setSilenceCountdown(null)
    setLiveTranscript("")
    finalAccumulatedRef.current = ""

    isProcessingRef.current = true
    shouldListenRef.current = false

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    isRecordingRef.current = false
    setIsRecording(false)

    const clean = spokenSentence.trim()
    if (clean) {
      processUserInput(clean)
    } else {
      isProcessingRef.current = false
    }
  }

  async function processUserInput(rawInput: string) {
    const userText = rawInput.trim()
    if (!userText) return

    const userMsgId = `usr-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: userText,
        timestamp: new Date(),
      },
    ])
    setInputValue("")

    const context: ConversationContext = {
      activeDraft,
      lastTopic: messages[messages.length - 1]?.text,
      userName: profile?.full_name || undefined,
      userGender: profile?.gender,
      history: messages.slice(-8).map((m) => ({ sender: m.sender, text: m.text })),
    }

    setIsTyping(true)

    try {
      const result = await executeLLMCompanionTurn(userText, messages, context, aiConfig)
      setIsTyping(false)

      if (result.intent) {
        handleExecuteActionIntent(result.intent, result.message)
      } else {
        addBotMessage(result.message)
      }
    } catch (err: any) {
      setIsTyping(false)
      addBotMessage(
        `⚠️ ${err?.message || "Execution in progress. Please re-try."}`
      )
    }
  }

  function handleExecuteActionIntent(intent: ParsedIntent, companionMessage?: string) {
    switch (intent.type) {
      case "order": {
        let autoRecipientName = intent.recipientName
        if (!autoRecipientName && session?.user?.id) {
          const stored = getStoredRecipients()
          if (stored.length > 0) {
            autoRecipientName = stored[0].name
          }
        }

        const draftCard: AssistantActionCard = {
          type: "order_draft",
          category: intent.category,
          title: autoRecipientName ? `${intent.title.split(" for ")[0]} for ${autoRecipientName}` : intent.title,
          description: intent.description,
          urgency: intent.urgency,
          recipientName: autoRecipientName,
          locationText: intent.locationText || "Cairo, Egypt",
          estimatedPrice: intent.estimatedPrice || 450,
          escrowAmount: intent.escrowAmount || 360,
        }

        setActiveDraft(draftCard)

        const genderSafety = profile?.gender
          ? `Strict same-gender rule active: Only verified ${profile.gender.toUpperCase()} companions will be matched.`
          : "Strict same-gender matching policy active."

        const reply = companionMessage || `I have structured your order: "${draftCard.title}". ${genderSafety} 80% Escrow is calculated at ${draftCard.escrowAmount} EGP. Say "Deploy it" or tap below to post live:`
        addBotMessage(reply, draftCard, [
          { label: "⚡ Deploy Order Now", action: "deploy_order", payload: draftCard },
          { label: "📝 Open Prefilled Form", action: "open_form_modal", payload: draftCard },
          { label: "📍 Add Live GPS Location", action: "get_location" },
        ])
        break
      }

      case "confirm_deploy": {
        addBotMessage(companionMessage || `Understood! Deploying order "${activeDraft?.title || intent.draft?.title || "Care Request"}" live right now...`)
        if (activeDraft) {
          handleDeployOrder(activeDraft)
        } else if (intent.draft) {
          handleDeployOrder({
            type: "order_draft",
            category: intent.draft.category,
            title: intent.draft.title,
            description: intent.draft.description,
            urgency: intent.draft.urgency,
            estimatedPrice: intent.draft.estimatedPrice,
            escrowAmount: intent.draft.escrowAmount,
            recipientName: intent.draft.recipientName,
            locationText: intent.draft.locationText,
          })
        }
        break
      }

      case "update_draft": {
        if (activeDraft) {
          const updated: Extract<AssistantActionCard, { type: "order_draft" }> = {
            ...activeDraft,
            ...intent.updates,
          }
          setActiveDraft(updated)
          const reply = `Updated your order draft: ${updated.title} · ${updated.urgency.toUpperCase()} urgency · Location: ${updated.locationText}. Ready to deploy!`
          addBotMessage(reply, updated, [
            { label: "⚡ Deploy Order Now", action: "deploy_order", payload: updated },
            { label: "📝 Open Form", action: "open_form_modal", payload: updated },
          ])
        } else {
          addBotMessage("No active order draft found to update. Would you like to create a new companion request?", undefined, [
            { label: "🤝 Book Companion", action: "start_order" },
          ])
        }
        break
      }

      case "form_fill": {
        const fields = intent.fields
        const formCard: AssistantActionCard = {
          type: "form_dictation",
          fields,
        }

        const reply = `Dictation captured successfully. I can apply this directly to a new service order or profile:`
        addBotMessage(reply, formCard, [
          {
            label: "Create Request from Dictation 📋",
            action: "apply_dictation_to_request",
            payload: fields,
          },
        ])
        break
      }

      case "location": {
        handleDetectLocation()
        break
      }

      case "urgent_service": {
        const reply = companionMessage || "Opening Urgent Service dispatch and emergency safety protocol immediately. I am remaining right here with you."
        setOpen(true)
        addBotMessage(reply)
        toast.error("🚨 Opening Urgent Service dispatch interface...", { duration: 4000 })
        window.dispatchEvent(new CustomEvent("wanes:open-urgent-service", { detail: { presetId: intent.presetId } }))
        window.dispatchEvent(new CustomEvent("nova:open-urgent-service", { detail: { presetId: intent.presetId } }))
        break
      }

      case "open_booking": {
        const reply = companionMessage || `Opening the booking flow for ${intent.title || "Companion Care Visit"}. I am staying right here with you on screen!`
        setOpen(true)
        addBotMessage(reply)
        const draftData = {
          title: intent.title || "Companion Care Visit",
          category: intent.category || "senior_care",
          description: intent.description || "Care assistance requested.",
          locationText: intent.locationText || "Cairo, Egypt",
          estimatedPrice: intent.estimatedPrice || 450,
          escrowAmount: intent.escrowAmount || 360,
        }
        toast.success("📋 Launching companion booking flow...", { duration: 3500 })
        window.dispatchEvent(new CustomEvent("wanes:open-request-modal", { detail: draftData }))
        window.dispatchEvent(new CustomEvent("nova:open-request-modal", { detail: draftData }))
        navigate("create-request")
        break
      }

      case "navigate": {
        const routeName = intent.targetRoute.replace(/^\//, "") as any
        navigate(routeName)
        const reply = companionMessage || `Navigated directly to ${intent.pageName}. I am staying right here with you—what would you like to explore next?`
        setOpen(true)
        addBotMessage(reply)
        toast.info(`Navigating to ${intent.pageName}...`)
        break
      }

      case "sos": {
        const reply = "🚨 CRITICAL EMERGENCY DETECTED: Platform SOS protocol engaged. Confirm below to broadcast your live GPS telemetry to central dispatch and family emergency contacts."
        addBotMessage(reply, { type: "sos_card", reason: intent.reason }, [
          { label: "Confirm Immediate SOS 🚨", action: "sos" },
        ])
        break
      }

      case "out_of_scope": {
        const reply =
          companionMessage ||
          "I'm happy to chat! While my core passion is eldercare and verified companionship across Egypt, I'm always here for you. How can I help you or your family today?"
        addBotMessage(reply)
        break
      }

      case "knowledge":
      case "general":
      default: {
        addBotMessage(companionMessage || intent.answer)
        break
      }
    }
  }

  function addBotMessage(text: string, card?: AssistantActionCard, actionSuggestions?: AssistantMessage["actionSuggestions"]) {
    const strictlyEnglishText = enforceStrictEnglish(text)

    const finalSuggestions = actionSuggestions

    const id = `bot-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id,
        sender: "bot",
        text: strictlyEnglishText,
        timestamp: new Date(),
        card,
        actionSuggestions: finalSuggestions,
      },
    ])

    if (autoVoiceEnabled) {
      speakText(strictlyEnglishText, id, () => {
        isProcessingRef.current = false
        if (handsFreeLoopRef.current && openRef.current) {
          const stillSpeaking =
            isSpeakingRef.current ||
            isSpeechSynthesizingRef.current ||
            (typeof window !== "undefined" && window.speechSynthesis?.speaking)

          if (!stillSpeaking && !isRecordingRef.current && openRef.current) {
            startListening(false)
          }
        }
      })
    } else {
      isProcessingRef.current = false
      if (handsFreeLoopRef.current && openRef.current) {
        setTimeout(() => {
          const stillSpeaking =
            isSpeakingRef.current ||
            isSpeechSynthesizingRef.current ||
            (typeof window !== "undefined" && window.speechSynthesis?.speaking)

          if (!stillSpeaking && !isRecordingRef.current && openRef.current) {
            startListening(false)
          }
        }, 300)
      }
    }
  }

  function handleDetectLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      addBotMessage("Geolocation is not supported in this browser. Please specify your address (e.g., 'Maadi, Cairo').")
      return
    }

    toast.info("Acquiring high-precision GPS telemetry...", { duration: 2500 })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000
        const lng = Math.round(pos.coords.longitude * 10000) / 10000
        const accuracy = Math.round(pos.coords.accuracy)
        const districtText = `${lat > 30 ? "Greater Cairo Hub" : "Egypt Region"} (${lat}° N, ${lng}° E)`

        const locationCard: AssistantActionCard = {
          type: "location_result",
          latitude: lat,
          longitude: lng,
          accuracy,
          districtText,
        }

        const reply = `📍 Live GPS Telemetry Acquired: Coordinates ${lat}, ${lng} (accuracy ~${accuracy}m). Telemetry is ready to attach to any care request or emergency broadcast.`
        addBotMessage(reply, locationCard, [
          {
            label: "⚡ Create Visit at this GPS",
            action: "start_order_with_gps",
            payload: { lat, lng, text: districtText },
          },
        ])
      },
      (err) => {
        const fallbackText = "Cairo Downtown Hub (GPS 30.0444, 31.2357)"
        const locationCard: AssistantActionCard = {
          type: "location_result",
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 50,
          districtText: fallbackText,
        }
        addBotMessage(`GPS hardware permission pending (${err.message}). Acquired Cairo default coords (30.0444, 31.2357).`, locationCard)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  async function handleDeployOrder(draft: Extract<AssistantActionCard, { type: "order_draft" }>) {
    if (!session) {
      setPendingRequestIntent({
        title: draft.title,
        category: draft.category,
        urgency: draft.urgency,
        description: draft.description,
        location_text: draft.locationText,
        latitude: draft.latitude || null,
        longitude: draft.longitude || null,
        recipientName: draft.recipientName,
        amount: draft.estimatedPrice,
      })
      toast.info("Please sign in to deploy your request. Your order draft is safely saved.")
      navigate("signin")
      return
    }

    if (!profile?.gender) {
      toast.error("Please set your gender in Profile Settings before deploying orders to enforce same-gender matching.")
      navigate("dashboard")
      return
    }

    setDeployingOrder(draft.title)
    try {
      const { data, error } = await supabase
        .from("assistance_requests")
        .insert({
          requester_id: session.user.id,
          requester_name: profile.full_name || "Valued Client",
          requester_gender: profile.gender,
          care_recipient_name: draft.recipientName || null,
          title: draft.title,
          category: draft.category,
          urgency: draft.urgency,
          description: draft.description,
          location_text: draft.locationText || "Client Location",
          latitude: draft.latitude || null,
          longitude: draft.longitude || null,
          payout_amount: draft.estimatedPrice,
          escrow_amount: draft.escrowAmount,
          status: "open",
        })
        .select()
        .single()

      if (error) throw error

      liveSync.broadcast({
        type: "request_created",
        requestId: data?.id,
      })

      await supabase.from("notifications").insert({
        user_id: session.user.id,
        type: "request",
        title: "Order Deployed by Wanes Master Companion",
        message: `Your request "${draft.title}" was autonomously posted. 80% Escrow (${draft.escrowAmount} EGP) is reserved.`,
        is_read: false,
      })

      toast.success("Order deployed autonomously! Dispatched to nearby vetted companions.")

      setActiveDraft(null)

      setMessages((prev) =>
        prev.map((m) => {
          if (m.card?.type === "order_draft" && m.card.title === draft.title) {
            return {
              ...m,
              card: {
                ...m.card,
                isDeployed: true,
                deployedId: data?.id,
              },
            }
          }
          return m
        })
      )

      addBotMessage(
        `✅ SUCCESS: Request "${draft.title}" is deployed live (Order #${data?.id?.slice(0, 8) || "WANES"}). 80% Escrow of ${draft.escrowAmount} EGP is reserved safely in transit. You can monitor matching and chat with prospective companions in your dashboard.`,
        undefined,
        [
          { label: "📊 Track in Care Dashboard", action: "navigate", payload: { route: "dashboard" } },
          { label: "💳 Paymob Checkout / Deposit", action: "navigate", payload: { route: "checkout" } },
        ]
      )
    } catch (err: any) {
      console.error("Order deployment error:", err)
      toast.error("Failed to deploy order automatically. Opening in form modal.")
      handleOpenFormModal(draft)
    } finally {
      setDeployingOrder(null)
    }
  }

  function handleOpenFormModal(draft: Extract<AssistantActionCard, { type: "order_draft" }>) {
    setPendingRequestIntent({
      title: draft.title,
      category: draft.category,
      urgency: draft.urgency,
      description: draft.description,
      location_text: draft.locationText,
      latitude: draft.latitude || null,
      longitude: draft.longitude || null,
      recipientName: draft.recipientName,
      amount: draft.estimatedPrice,
    })

    toast.info("Form populated with AI dictation! Opening request form...")
    navigate("dashboard")
    setOpen(true)
    addBotMessage(`I have prefilled the request form for "${draft.title}" in your Care Dashboard. I'm staying right here with you—let me know if you would like me to deploy it or make any changes!`)
  }

  async function handleConfirmSos() {
    setSosTriggering(true)
    try {
      const userId = session?.user?.id || "emergency_guest"
      const { data } = await supabase
        .from("assistance_requests")
        .insert({
          requester_id: userId,
          requester_name: profile?.full_name || "Emergency SOS Caller",
          requester_gender: profile?.gender || null,
          title: "🚨 URGENT EMERGENCY SOS: Triggered via Wanes Master Companion",
          category: "emergency_sos",
          urgency: "critical",
          description: `High-priority rapid SOS triggered directly from Wanes AI Companion. Coordinates: Live GPS Telemetry. Caller: ${profile?.full_name || "Emergency User"}.`,
          location_text: "Live GPS Telemetry Broadcast Active",
          status: "open",
        })
        .select()
        .single()

      if (session?.user?.id) {
        await supabase.from("notifications").insert({
          user_id: session.user.id,
          type: "sos",
          title: "🚨 SOS Alert Active",
          message: "Emergency broadcast dispatched to local responders and emergency contacts.",
          is_read: false,
        })
      }

      liveSync.broadcast({
        type: "request_created",
        requestId: data?.id,
      })

      toast.error("🚨 SOS DISPATCH ACTIVE: Emergency responders alerted with live GPS coordinates!", {
        duration: 9000,
      })

      addBotMessage(
        "🚨 SOS ALERT BROADCASTED: Coordinates transmitted to verified local responders and emergency family contacts. Central 24/7 dispatch is active. Stay calm, help is inbound!",
        undefined,
        [
          { label: "📞 Call Emergency Hotline: +1 (800) 555-6682", action: "call_hotline" },
          { label: "📊 View SOS in Dashboard", action: "navigate", payload: { route: "dashboard" } },
        ]
      )
    } catch (err) {
      console.error("SOS trigger error:", err)
      toast.error("Emergency alert triggered. Please also dial 123 for national emergency services.")
    } finally {
      setSosTriggering(false)
    }
  }

  function handleSaveAIConfig(e: React.FormEvent) {
    e.preventDefault()
    const updated: AIProviderConfig = {
      provider: tempProvider,
      apiKey: tempApiKey.trim() || undefined,
      model: tempModel.trim() || undefined,
    }
    setAiConfig(updated)
    saveStoredAIConfig(updated)
    setSettingsOpen(false)
    toast.success(`Active LLM Brain updated: ${tempProvider.toUpperCase()} (${tempModel || "Default Model"})`)
  }

  async function handleTestAIConnection() {
    if (!tempApiKey.trim()) {
      toast.error("Please enter an API key to test.")
      return
    }

    setTestingConnection(true)
    try {
      const testResult = await testLLMConnection({
        provider: tempProvider,
        apiKey: tempApiKey.trim(),
        model: tempModel.trim() || undefined,
      })
      if (testResult.success) {
        toast.success(`🟢 Connection to ${tempProvider.toUpperCase()} verified (${testResult.latencyMs}ms)!`)
      } else {
        toast.error(`❌ Connection test failed: ${testResult.error}`)
      }
    } catch (e: any) {
      toast.error(`Connection test error: ${e.message}`)
    } finally {
      setTestingConnection(false)
    }
  }

  function handleActionClick(action: string, payload?: any) {
    interruptSpeaking("Action clicked: " + action)
    switch (action) {
      case "open_settings": {
        setSettingsOpen(true)
        break
      }
      case "start_order": {
        processUserInput("Book a senior companionship visit for today")
        break
      }
      case "get_location": {
        handleDetectLocation()
        break
      }
      case "sos": {
        handleConfirmSos()
        break
      }
      case "ask_escrow": {
        processUserInput("How does the 80% companion escrow model work?")
        break
      }
      case "ask_gender": {
        processUserInput("Explain the same-gender safety policy")
        break
      }
      case "navigate": {
        const route = payload?.route as Route
        if (route) {
          navigate(route)
          toast.info(`Navigated to ${route.replace(/_/g, " ")}`)
          setOpen(true)
          addBotMessage(`Navigated to the ${route.replace(/_/g, " ")} page. I am staying right here by your side—how can I help next?`)
        }
        break
      }
      case "deploy_order": {
        if (payload) {
          handleDeployOrder(payload)
        }
        break
      }
      case "open_form_modal": {
        if (payload) {
          handleOpenFormModal(payload)
        }
        break
      }
      case "apply_dictation_to_request": {
        const fields = payload
        const draft: Extract<AssistantActionCard, { type: "order_draft" }> = {
          type: "order_draft",
          category: fields?.category || "senior_care",
          title: `Care Request for ${fields?.name || "Family Member"}`,
          description: fields?.notes || "Assistance visit requested via voice dictation.",
          urgency: "normal",
          recipientName: fields?.name,
          locationText: fields?.address || "Cairo, Egypt",
          estimatedPrice: 450,
          escrowAmount: 360,
        }
        handleDeployOrder(draft)
        break
      }
      case "start_order_with_gps": {
        const draft: Extract<AssistantActionCard, { type: "order_draft" }> = {
          type: "order_draft",
          category: "senior_care",
          title: "Senior Care Visit (GPS Verified Location)",
          description: `Companion visit requested at verified coordinates (${payload.lat}, ${payload.lng}).`,
          urgency: "normal",
          locationText: payload.text || "Live GPS Location",
          latitude: payload.lat,
          longitude: payload.lng,
          estimatedPrice: 450,
          escrowAmount: 360,
        }
        handleDeployOrder(draft)
        break
      }
      case "call_hotline": {
        window.open("tel:18005556682")
        break
      }
      default:
        processUserInput(action)
        break
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-center">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mr-3 hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#1E293B]/90 px-3.5 py-1.5 text-xs font-bold text-[#F8FAFC] shadow-md shadow-black/50 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 transition-transform hover:scale-105 hover:border-[#3B82F6]/50 cursor-pointer group"
            title="Toggle Wanes Master Companion (Alt + A)"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-[#3B82F6] opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-[#059669] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="tracking-tight text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors">
              Wanes Master Companion
            </span>
            <span className="text-[10px] text-[#3B82F6] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/[0.08] hidden md:inline">
              Alt+A
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#06B6D4] text-white shadow-[0_8px_25px_-5px_rgba(0,0,0,0.6),0_0_12px_rgba(59,130,246,0.2)] border-2 border-[#93C5FD]/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25"
          aria-label="Toggle Wanes Master Companion AI"
        >
          {open ? (
            <X className="size-6 text-white transition-transform duration-200 rotate-0 group-hover:rotate-90 stroke-[2.5]" />
          ) : (
            <>
              <Sparkles className="size-6 text-white animate-pulse stroke-[2.3]" />
              <span className="absolute -top-1 -right-1 flex size-4">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-[#059669] opacity-80" />
                <span className="relative inline-flex rounded-full size-4 bg-[#059669] border-2 border-[#0F172A] shadow-sm" />
              </span>
            </>
          )}
        </button>
      </div>

      {open && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col ${
            isExpanded ? "w-[580px] h-[670px]" : "w-[390px] sm:w-[440px] h-[590px]"
          } max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] rounded-3xl border border-white/[0.08] bg-[#1E293B]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#F8FAFC] flex-col justify-between`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0F172A]/80 px-4 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 items-center justify-center rounded-2xl bg-[#3B82F6] text-white font-black shadow-lg shadow-[#3B82F6]/30 border border-[#06B6D4]/40">
                <Bot className="size-5 stroke-[2.5]" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#059669] border-2 border-[#0F172A]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-[#F8FAFC] leading-none">
                    Wanes Master Companion
                  </h3>
                  <Badge className="bg-[#3B82F6]/15 text-[#06B6D4] border-[#3B82F6]/30 text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider">
                    {aiConfig.apiKey ? aiConfig.provider.toUpperCase() : "ONLINE"}
                  </Badge>
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1">
                  <span className={`size-1.5 rounded-full ${isRecording ? "bg-[#EF4444] animate-ping" : "bg-[#059669]"}`} />
                  <span>
                    {isRecording
                      ? "Listening Live & Detecting Silence..."
                      : handsFreeLoop
                      ? "Hands-Free Conversational Loop Active"
                      : "Voice & Text Platform Autonomy"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = !handsFreeLoop
                  setHandsFreeLoop(next)
                  toast.info(next ? "Hands-free continuous conversation enabled" : "Hands-free continuous conversation paused", { duration: 1600 })
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  handsFreeLoop
                    ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={handsFreeLoop ? "Hands-Free Continuous Mode Active (Auto-Listens after speaking)" : "Turn on Hands-Free Continuous Mode"}
                aria-label="Toggle hands free loop"
              >
                <Headphones className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !autoVoiceEnabled
                  setAutoVoiceEnabled(next)
                  if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel()
                    setSpeakingMessageId(null)
                  }
                  toast.info(next ? "Voice narration active" : "Voice narration muted", { duration: 1600 })
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  autoVoiceEnabled
                    ? "text-[#3B82F6] bg-[#3B82F6]/15 border border-[#3B82F6]/30"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
                }`}
                title={autoVoiceEnabled ? "Voice Narration Enabled" : "Voice Narration Muted"}
                aria-label="Toggle voice narration"
              >
                {autoVoiceEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-[#94A3B8] hover:text-[#3B82F6] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="AI Engine & API Key Settings"
                aria-label="AI Engine Settings"
              >
                <Settings className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title={isExpanded ? "Collapse to standard size" : "Expand power console"}
                aria-label="Toggle window size"
              >
                {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening()
                  setMessages([])
                  setActiveDraft(null)
                  toast.info("Conversation reset")
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RefreshCw className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening()
                  setOpen(false)
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Close companion"
                aria-label="Close companion"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto animate-in fade-in duration-200">
                <div className="size-14 rounded-3xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] shadow-lg shadow-[#3B82F6]/10">
                  <Bot className="size-7" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-sm font-bold text-[#F8FAFC]">Wanes Dispatch & Coordination</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Schedule verified companion visits, clinic escorts, or pharmacy runs across Cairo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-xs pt-1">
                  <button
                    type="button"
                    onClick={() => processUserInput("Book senior companionship in Maadi")}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#06B6D4] hover:bg-[#3B82F6]/20 transition-colors cursor-pointer"
                  >
                    🤝 Book Companion
                  </button>
                  <button
                    type="button"
                    onClick={() => processUserInput("How does the 80% Paymob escrow deposit work?")}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    🧮 80% Escrow
                  </button>
                  <button
                    type="button"
                    onClick={() => processUserInput("What documents are required for helper verification?")}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.08] bg-[#0F172A]/60 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    🛡️ Verification Rules
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                {msg.sender === "bot" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25 mt-0.5">
                    <Bot className="size-3.5" />
                  </div>
                )}

                <div className={`space-y-2.5 max-w-[85%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`relative p-3.5 sm:p-4 rounded-2xl leading-relaxed text-xs shadow-md ${
                      msg.sender === "user"
                        ? "bg-[#3B82F6] text-white font-semibold rounded-tr-none shadow-[#3B82F6]/20"
                        : "bg-[#0F172A]/80 border border-white/[0.08] text-[#F8FAFC] rounded-tl-none backdrop-blur-md shadow-inner"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {msg.sender === "bot" && (
                      <div className="flex items-center justify-end pt-2 -mb-1">
                        <button
                          type="button"
                          onClick={() => speakText(msg.text, msg.id)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            speakingMessageId === msg.id
                              ? "bg-[#3B82F6]/20 text-[#06B6D4] font-bold border border-[#3B82F6]/40"
                              : "text-[#94A3B8] hover:text-[#3B82F6] hover:bg-white/5"
                          }`}
                          title={speakingMessageId === msg.id ? "Stop reading" : "Read aloud"}
                        >
                          <Volume2 className={`size-3 ${speakingMessageId === msg.id ? "animate-pulse text-[#3B82F6]" : ""}`} />
                          <span>{speakingMessageId === msg.id ? "Speaking..." : "Listen"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.card && msg.card.type === "order_draft" && (
                    <div className="rounded-2xl border border-[#3B82F6]/30 bg-[#0F172A]/90 p-4 space-y-3.5 shadow-xl backdrop-blur-xl">
                      <div className="flex items-start justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                            <CalendarPlus className="size-3.5" />
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                              Autonomous Order Draft
                            </span>
                            <h4 className="font-bold text-[#F8FAFC] text-xs sm:text-sm leading-tight">
                              {msg.card.title}
                            </h4>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-[#059669]/40 bg-[#059669]/15 text-[#059669] text-[10px] shrink-0 font-bold"
                        >
                          80% Escrow
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#94A3B8]">
                        <div className="rounded-xl border border-white/[0.08] bg-[#1E293B]/70 p-2">
                          <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block font-semibold">
                            Recipient
                          </span>
                          <span className="font-bold text-[#F8FAFC] truncate block">
                            {msg.card.recipientName || "Client / Loved One"}
                          </span>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-[#1E293B]/70 p-2">
                          <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block font-semibold">
                            Location
                          </span>
                          <span className="font-bold text-[#F8FAFC] truncate block">
                            {msg.card.locationText || "Cairo, Egypt"}
                          </span>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-[#1E293B]/70 p-2">
                          <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block font-semibold">
                            Quote / Payout
                          </span>
                          <span className="font-bold text-[#3B82F6]">
                            {msg.card.estimatedPrice} EGP
                          </span>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-[#1E293B]/70 p-2">
                          <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block font-semibold">
                            Escrow Reserve (80%)
                          </span>
                          <span className="font-bold text-[#059669]">
                            {msg.card.escrowAmount} EGP
                          </span>
                        </div>
                      </div>

                      {msg.card.isDeployed ? (
                        <div className="flex items-center justify-between rounded-xl border border-[#059669]/40 bg-[#059669]/15 p-2.5 text-xs text-[#059669] font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-4 text-[#059669]" />
                            <span>Order Deployed Live &amp; Dispatched!</span>
                          </span>
                          <Button
                            size="sm"
                            onClick={() => navigate("dashboard")}
                            className="bg-[#059669] text-white hover:bg-[#059669] text-[10px] font-bold h-7 px-3 rounded-lg"
                          >
                            View in Dashboard &rarr;
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            disabled={deployingOrder === msg.card.title}
                            onClick={() => handleDeployOrder(msg.card as any)}
                            className="flex-1 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-extrabold text-xs h-9 rounded-xl shadow-md shadow-[#3B82F6]/20 gap-1.5 cursor-pointer"
                          >
                            {deployingOrder === msg.card.title ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Zap className="size-3.5 fill-white" />
                            )}
                            <span>Deploy Order Automatically</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFormModal(msg.card as any)}
                            className="border-white/[0.08] bg-white/[0.03] text-[#F8FAFC] hover:text-white hover:bg-white/10 text-xs h-9 px-3 rounded-xl cursor-pointer"
                            title="Open form modal prefilled"
                          >
                            <FileText className="size-3.5 text-[#3B82F6]" />
                            <span className="hidden sm:inline">Edit Form</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.card && msg.card.type === "location_result" && (() => {
                    const loc = msg.card
                    return (
                      <div className="rounded-2xl border border-sky-500/35 bg-[#0F172A]/90 p-3.5 space-y-2.5 shadow-lg backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                            <Compass className="size-4 text-sky-400 animate-spin" />
                            <span>GPS Telemetry Locked</span>
                          </div>
                          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[9px]">
                            ~{loc.accuracy}m accuracy
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] font-medium">
                          Coordinates: <strong className="text-[#F8FAFC]">{loc.latitude}, {loc.longitude}</strong> ({loc.districtText})
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              navigator.clipboard?.writeText?.(`${loc.latitude}, ${loc.longitude}`)
                              toast.success("GPS coordinates copied to clipboard!")
                            }}
                            className="bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold text-[10px] h-7 px-3 rounded-lg cursor-pointer"
                          >
                            Copy Coordinates
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActionClick("start_order_with_gps", { lat: loc.latitude, lng: loc.longitude, text: loc.districtText })}
                            className="border-white/[0.08] text-xs h-7 text-[#94A3B8] hover:text-[#F8FAFC]"
                          >
                            Attach to New Request &rarr;
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

                  {msg.card && msg.card.type === "sos_card" && (
                    <div className="rounded-2xl border border-[#EF4444]/50 bg-[#EF4444]/10 p-4 space-y-3 shadow-xl shadow-red-950/50">
                      <div className="flex items-center gap-2 text-[#EF4444] font-extrabold text-xs">
                        <ShieldAlert className="size-4 animate-pulse" />
                        <span>EMERGENCY SOS DISPATCH PROTOCOL</span>
                      </div>
                      <p className="text-[11px] text-red-200 leading-relaxed">
                        This immediately packages your live GPS telemetry and broadcasts a critical emergency alert to our 24/7 central desk and family contacts.
                      </p>
                      <Button
                        size="sm"
                        disabled={sosTriggering}
                        onClick={handleConfirmSos}
                        className="w-full bg-[#EF4444] hover:bg-red-600 text-white font-extrabold h-10 text-xs rounded-xl shadow-lg shadow-[#EF4444]/40 gap-2 cursor-pointer"
                      >
                        {sosTriggering ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShieldAlert className="size-4" />
                        )}
                        CONFIRM &amp; BROADCAST SOS NOW
                      </Button>
                    </div>
                  )}

                  <span className="text-[9px] text-[#94A3B8] px-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#06B6D4] border border-[#3B82F6]/30 mt-0.5">
                    <User className="size-3.5" />
                  </div>
                )}
              </div>
            )))}

            {isRecording && liveTranscript && (
              <div className="flex justify-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="max-w-[85%] rounded-2xl rounded-tr-none border border-[#3B82F6]/40 bg-[#3B82F6]/15 p-3.5 shadow-lg text-[#F8FAFC] text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-[#3B82F6]/20 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#06B6D4]">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#EF4444] animate-ping" />
                      Live Speaking...
                    </span>
                    {silenceCountdown !== null && (
                      <span className="text-[#3B82F6] bg-[#3B82F6]/20 px-1.5 py-0.5 rounded font-mono">
                        Auto-sending on pause...
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-[#F8FAFC] leading-relaxed">
                    {liveTranscript}
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#3B82F6] animate-pulse align-middle" />
                  </p>
                </div>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 mt-0.5">
                  <Mic className="size-3.5 animate-bounce" />
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center gap-2 text-[#94A3B8] text-xs pl-9 py-1">
                <Loader2 className="size-3.5 animate-spin text-[#3B82F6]" />
                <span className="text-[11px] text-[#3B82F6] font-medium animate-pulse">
                  Processing request...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {speakingMessageId && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#0F172A]/90 border-t border-[#3B82F6]/30 text-[#F8FAFC] text-xs animate-in slide-in-from-bottom-1 duration-150">
              <div className="flex items-center gap-2">
                <Volume2 className="size-3.5 text-[#3B82F6] animate-pulse" />
                <span className="font-semibold text-[11px] text-[#3B82F6]">Wanes is speaking aloud...</span>
                <span className="text-[10px] text-[#94A3B8] hidden sm:inline">(Speak anytime to interrupt instantly)</span>
              </div>
              <button
                type="button"
                onClick={() => interruptSpeaking("Manual tap on interrupt banner")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-white font-bold text-[10px] border border-[#3B82F6]/40 transition-all cursor-pointer shadow-sm"
              >
                <VolumeX className="size-3" />
                <span>Interrupt ⏹️</span>
              </button>
            </div>
          )}

          {isRecording && !speakingMessageId && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A]/90 border-t border-[#3B82F6]/30 text-[#F8FAFC] text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 font-bold">
                <span className="size-2 rounded-full bg-[#EF4444] animate-ping" />
                <span className="text-[11px] tracking-wide text-[#94A3B8]">
                  Listening word-by-word... Pause 2.2s to auto-send
                </span>
                <div className="flex items-center gap-0.5 ml-2">
                  <span className="w-1 h-3 bg-[#EF4444] rounded-full animate-pulse" />
                  <span className="w-1 h-5 bg-[#3B82F6] rounded-full animate-bounce" />
                  <span className="w-1 h-2 bg-[#EF4444] rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-[#3B82F6] rounded-full animate-bounce" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (liveTranscript.trim()) {
                    handleCommitVoiceTurn(liveTranscript)
                  } else {
                    stopListening()
                  }
                }}
                className="text-[10px] text-[#3B82F6] hover:text-white font-extrabold uppercase tracking-wider underline cursor-pointer"
              >
                Send Now &rarr;
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              interruptSpeaking("Form submit")
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
              }
              processUserInput(inputValue)
            }}
            className="p-3 border-t border-white/[0.08] bg-[#0F172A] flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => {
                if (isSpeakingRef.current) {
                  interruptSpeaking("User typing in input")
                }
                setInputValue(e.target.value)
              }}
              placeholder={
                speakingMessageId
                  ? "Audio playback active. Type or speak to interrupt..."
                  : isRecording
                  ? "Listening... (auto-submits on pause)"
                  : "Type a request, dictate visit details, or tap the mic..."
              }
              className={`h-11 text-xs border-white/[0.08] bg-[#1E293B]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 rounded-2xl focus-visible:border-[#3B82F6] transition-colors ${
                isRecording ? "border-[#3B82F6]/60 bg-[#3B82F6]/10 placeholder:text-[#06B6D4]" : ""
              }`}
            />

            <Button
              type="button"
              size="icon"
              onClick={toggleRecording}
              className={`size-11 shrink-0 rounded-2xl transition-all cursor-pointer ${
                isRecording
                  ? "bg-[#EF4444]/25 hover:bg-[#DC2626]/35 border-2 border-[#EF4444] text-[#EF4444] animate-pulse shadow-lg shadow-[#EF4444]/40 ring-2 ring-[#EF4444]/40"
                  : "bg-white/5 hover:bg-[#3B82F6]/15 border border-white/[0.08] hover:border-[#3B82F6]/30 text-[#94A3B8] hover:text-[#3B82F6] shadow-sm"
              }`}
              title={isRecording ? "Listening... Pause to auto-send or tap to stop" : "Start Live Voice Interaction"}
              aria-label={isRecording ? "Stop listening" : "Start listening"}
            >
              <Mic className={`size-4.5 ${isRecording ? "text-[#EF4444] animate-bounce" : ""}`} />
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim()}
              className="size-11 bg-[#3B82F6] text-white hover:bg-[#2563EB] font-extrabold shrink-0 rounded-2xl shadow-md shadow-[#3B82F6]/25 cursor-pointer disabled:opacity-40"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-white/[0.08] bg-[#1E293B] text-[#F8FAFC] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                <Cpu className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#F8FAFC]">
                  Wanes AI Engine &amp; API Configuration
                </DialogTitle>
                <DialogDescription className="text-xs text-[#94A3B8]">
                  Select your intelligence provider or connect external LLM API tokens
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveAIConfig} className="space-y-4 pt-2 text-xs">
            <div className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] font-semibold text-[11px]">Real LLM Brain Status</span>
                {aiConfig.apiKey ? (
                  <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/30 text-[10px] font-bold">
                    🟢 Live: {aiConfig.provider.toUpperCase()}
                  </Badge>
                ) : (
                  <Badge className="bg-[#3B82F6]/15 text-[#06B6D4] border-[#3B82F6]/30 text-[10px] font-bold">
                    ⚠️ API Key Required
                  </Badge>
                )}
              </div>
              <p className="text-[#94A3B8] text-xs">
                {aiConfig.apiKey
                  ? `Direct unmediated connection to ${aiConfig.provider.toUpperCase()} (${aiConfig.model || "Default Model"}). Zero dummy rules or canned filler.`
                  : "Connect your API key below to activate direct high-intelligence companion reasoning with Gemini 1.5 Flash or OpenAI."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F8FAFC]">
                Intelligence Provider
              </label>
              <Select
                value={tempProvider}
                onValueChange={(v) => {
                  const p = v as AIProviderType
                  setTempProvider(p)
                  if (p === "gemini") setTempModel("gemini-3.5-flash-lite")
                  if (p === "openai") setTempModel("gpt-4o-mini")
                  if (p === "groq") setTempModel("llama-3.3-70b-versatile")
                  if (p === "anthropic") setTempModel("claude-3-5-sonnet-20241022")
                }}
              >
                <SelectTrigger className="w-full h-10 border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] rounded-xl">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#1E293B] text-[#F8FAFC]">
                  <SelectItem value="gemini">Google Gemini (Gemini 3.5 Flash-Lite - Recommended)</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT-4o / GPT-4o-mini)</SelectItem>
                  <SelectItem value="groq">Groq (Ultra-Fast Llama 3.3)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude 3.5 Sonnet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F8FAFC] flex items-center justify-between">
                  <span>{tempProvider.toUpperCase()} API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-[#3B82F6] hover:text-[#06B6D4] flex items-center gap-1 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    <span>{showApiKey ? "Hide" : "Show"}</span>
                  </button>
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={`Enter your ${tempProvider.toUpperCase()} API key...`}
                    className="h-10 border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] font-mono text-xs rounded-xl pr-10 focus:border-[#3B82F6]"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-[#94A3B8]">
                    Stored locally in your browser. Never shared.
                  </p>
                  {tempProvider === "gemini" && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#3B82F6] hover:underline"
                    >
                      Get Free Gemini Key &rarr;
                    </a>
                  )}
                  {tempProvider === "openai" && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#3B82F6] hover:underline"
                    >
                      Get OpenAI Key &rarr;
                    </a>
                  )}
                  {tempProvider === "groq" && (
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#3B82F6] hover:underline"
                    >
                      Get Free Groq Key &rarr;
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F8FAFC]">
                  Model Name (Optional)
                </label>
                <Input
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  placeholder={
                    tempProvider === "openai"
                      ? "gpt-4o-mini"
                      : tempProvider === "groq"
                      ? "llama-3.3-70b-versatile"
                      : tempProvider === "anthropic"
                      ? "claude-3-5-sonnet-20241022"
                      : "gemini-3.5-flash-lite"
                  }
                  className="h-10 border-white/[0.08] bg-[#0F172A] text-[#F8FAFC] text-xs rounded-xl focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                disabled={testingConnection || !tempApiKey.trim()}
                onClick={handleTestAIConnection}
                className="border-white/[0.08] bg-white/[0.03] text-[#94A3B8] hover:text-[#F8FAFC] h-9 text-xs rounded-xl cursor-pointer"
              >
                {testingConnection ? <Loader2 className="size-3 animate-spin mr-1" /> : <Radio className="size-3 mr-1 text-[#059669]" />}
                <span>Test Connection</span>
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSettingsOpen(false)}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] h-9 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#3B82F6] text-white hover:bg-[#2563EB] font-bold h-9 text-xs px-4 rounded-xl cursor-pointer shadow-md shadow-[#3B82F6]/20"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
