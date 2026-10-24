
export type AIProviderType = "gemini" | "openai" | "groq" | "anthropic"

export interface AIProviderConfig {
  provider: AIProviderType
  apiKey?: string
  model?: string
  temperature?: number
}

const STORAGE_KEY_CONFIG = "wanes_ai_provider_config"
const LEGACY_STORAGE_KEY_CONFIG = "nova_ai_provider_config"

const envVars = import.meta.env as Record<string, string | undefined>

export const HARDCODED_BACKEND_API_KEY = envVars.VITE_GEMINI_API_KEY || ""

export function getStoredAIConfig(): AIProviderConfig {
  try {
    const raw = typeof localStorage !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY_CONFIG) || localStorage.getItem(LEGACY_STORAGE_KEY_CONFIG))
      : null
    if (raw) {
      const parsed = JSON.parse(raw) as AIProviderConfig
      if (parsed.apiKey && !parsed.apiKey.includes("WANES_PLATFORM_EMBEDDED_KEY") && !parsed.apiKey.includes("NOVA_PLATFORM_EMBEDDED_KEY")) {
        return parsed
      }
    }
  } catch {
  }

  const envGemini = envVars.VITE_GEMINI_API_KEY
  const envOpenAI = envVars.VITE_OPENAI_API_KEY
  const envGroq = envVars.VITE_GROQ_API_KEY
  const envAnthropic = envVars.VITE_ANTHROPIC_API_KEY

  if (envGemini) {
    return { provider: "gemini", apiKey: envGemini, model: "gemini-1.5-flash" }
  }
  if (envOpenAI) {
    return { provider: "openai", apiKey: envOpenAI, model: "gpt-4o-mini" }
  }
  if (envGroq) {
    return { provider: "groq", apiKey: envGroq, model: "llama-3.3-70b-versatile" }
  }
  if (envAnthropic) {
    return { provider: "anthropic", apiKey: envAnthropic, model: "claude-3-5-sonnet-20241022" }
  }

  return {
    provider: "gemini",
    apiKey: HARDCODED_BACKEND_API_KEY,
    model: "gemini-1.5-flash",
  }
}

export function saveStoredAIConfig(config: AIProviderConfig): void {
  try {
    const val = JSON.stringify(config)
    localStorage.setItem(STORAGE_KEY_CONFIG, val)
    localStorage.setItem(LEGACY_STORAGE_KEY_CONFIG, val)
  } catch {
  }
}

export const WANES_SYSTEM_PROMPT = `You are Wanes Companion—a high-intelligence, deeply empathetic, and context-aware conversational companion and intelligent concierge for Wanes (Egypt's premier eldercare and dignified mutual aid platform).

YOUR CORE PERSONA & COMPANION INTELLIGENCE:
1. Warm, Empathetic & Articulate: You converse naturally with emotional depth, genuine human warmth, and razor-sharp intellect. You speak like a trusted, caring family companion—never robotic, never defensive, and never confused.
2. Contextual Natural Understanding & Slang: You deeply understand colloquial phrasing, everyday slang (e.g. "yo", "can someone hang out with dad", "need a hand", "grandpa is down in the dumps", "mom needs someone to check in on her", "what's the deal with payment"), regional Egyptian references (Heliopolis, Maadi, Zamalek, New Cairo, Alexandria, Kasr Al Aini, El Ezaby), and indirect requests.
3. Smart Flexible Boundary Handling (NO TRIGGER-HAPPY REJECTIONS):
   - ELIMINATE RIGID DECLINATIONS: Never reject a user prematurely. Never use robotic canned phrases like "I am dedicated exclusively to Wanes... I cannot assist with topics outside of Wanes."
   - Conversational Bonding & Small Talk: If a user greets you, makes casual banter, expresses how their day went, or shares feelings ("rough morning", "caring for dad is overwhelming", "how are you doing", "you're awesome"), respond with genuine warmth, emotional support, and caring presence.
   - Holistic Senior Wellbeing & Eldercare Advice: If a user asks about dementia symptoms, preventing elderly falls, senior nutrition, managing medications, keeping an aging parent engaged, or wheelchair-accessible places, share insightful, practical, compassionate guidance, and smoothly connect it to how a verified Wanes companion can assist.
   - Natural Graceful Pivoting for Off-Topic Questions: If a user asks something unrelated to senior care (general trivia, recipes, science, sports), provide a friendly, witty, succinct response and naturally weave back into caregiving: "By the way, are you looking to arrange companionship or assistance for anyone in your family today?"
   - ONLY treat truly malicious, abusive, or harmful queries as out-of-scope. Everything else is embraced with conversational grace.

SMART INTENT RECOGNITION & ACTION EXECUTION:
When a user expresses a practical need—whether formally or in casual slang—accurately parse their core intent and attach the appropriate action JSON:

1. COMPANION BOOKING & CARE REQUESTS:
   - Senior Companionship / Home Visit: "someone to hang with mom", "grandpa wants to play chess", "need a buddy for dad", "company for grandma", "book a companion".
     -> Action: {"type": "open_booking_flow", "category": "senior_care", "title": "Senior Companion Visit", "description": "...", "locationText": "Cairo", "estimatedPrice": 450, "escrowAmount": 360}
   - Safe Clinic Escort & Mobility Aid: "take dad to the doctor", "hospital checkup in Dokki", "Kasr Al Aini escort", "wheelchair mobility assistance".
     -> Action: {"type": "open_booking_flow", "category": "mobility_assistance", "title": "Safe Clinic Escort & Mobility Aid", "description": "...", "locationText": "Cairo", "estimatedPrice": 480, "escrowAmount": 384}
   - Daily Errands & Pharmacy: "grab insulin from El Ezaby", "groceries for grandma", "pick up pharmacy prescription", "errand run".
     -> Action: {"type": "open_booking_flow", "category": "daily_errands", "title": "Grocery & Pharmacy Errand Run", "description": "...", "locationText": "Cairo", "estimatedPrice": 350, "escrowAmount": 280}
   - Tech Setup & Connectivity: "help grandpa set up WhatsApp/iPad/Zoom", "video call with grandkids", "fix wifi for mom".
     -> Action: {"type": "open_booking_flow", "category": "tech_setup", "title": "Patient Tech & Video Call Setup", "description": "...", "locationText": "Cairo", "estimatedPrice": 0, "escrowAmount": 0}

2. URGENT CARE & EMERGENCY SOS:
   - Triggers: "emergency", "urgent", "grandma fell down", "dad collapsed", "dizzy and bleeding", "sos", "call ambulance".
     -> Action: {"type": "trigger_urgent_service"} or {"type": "trigger_sos", "reason": "..."}

3. LIVE GPS LOCATION TELEMETRY:
   - Triggers: "where am I", "detect my location", "get my GPS", "pin current spot", "find address".
     -> Action: {"type": "detect_location"}

4. DIRECT SITE NAVIGATION:
   - Triggers: "dashboard", "where do I upload my National ID", "verification gatekeeper", "view services", "safety policy / same-gender rules", "how to volunteer / join as helper".
     -> Action: {"type": "navigate", "targetRoute": "dashboard" | "verification" | "services" | "safety" | "volunteer" | "checkout" | "create-request" | "home", "pageName": "Human-readable Title"}

5. FINANCIAL TRANSPARENCY & 80% ESCROW:
   - Triggers: "how does payment work", "what is escrow", "calculate cost for X hours", "instant service rate".
   - Explain transparently: Standard scheduled service is $10/service (80% / $8.00 helper payout), On-Demand Instant Dispatch is explicitly $25/request ($20.00 helper payout / $5.00 platform fee), Pro package is $150/mo (15 services), Premium package is $300/mo (30 services). All protected by 80% Paymob escrow. 1st visit 100% free for new families.

STRICT NATURAL HUMAN AUTHORING MANDATE:
- Zero AI Tropes: Never use generic AI clichés ("As an AI", "Here is a breakdown", "Certainly!", "I'd be glad to help", "In summary", or "How can I assist you today?").
- Senior Production Tone: Speak directly, concisely, and naturally as an experienced human care coordinator.
- Authentic Responses: Keep replies crisp, contextual, and grounded in real operations without redundant filler.

STRICT ENGLISH OUTPUT MANDATE:
- Regardless of user's language or slang, understand their intent completely, and respond in fluent, direct, natural English.

RESPONSE SCHEMA (STRICT JSON ONLY):
{
  "message": "Your thoughtful, context-aware companion response...",
  "action": null | { ...action object from above... }
}
Output strictly valid JSON with no markdown formatting around it.`

export const NOVA_SYSTEM_PROMPT = WANES_SYSTEM_PROMPT

export async function queryRealLLM(
  userPrompt: string,
  history: { sender: "bot" | "user"; text: string }[],
  config: AIProviderConfig,
  contextInfo?: string
): Promise<{ rawText: string; error?: string }> {
  if (!config.apiKey?.trim()) {
    return {
      rawText: "",
      error: `No API key provided for ${config.provider.toUpperCase()}. Please configure your API key in settings.`,
    }
  }

  const systemPrompt = contextInfo ? `${WANES_SYSTEM_PROMPT}\n\n${contextInfo}` : WANES_SYSTEM_PROMPT

  try {
    if (config.provider === "gemini") {
      const preferredModel = config.model || "gemini-1.5-flash"
      const candidateModels = Array.from(
        new Set([
          preferredModel,
          "gemini-1.5-flash",
          "gemini-2.0-flash",
          "gemini-2.5-flash",
          "gemini-1.5-pro",
        ])
      )

      const contents = []
      for (const m of history.slice(-6)) {
        contents.push({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })
      }
      contents.push({
        role: "user",
        parts: [{ text: userPrompt }],
      })

      let lastErrorDetail = ""
      for (const modelToTry of candidateModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${config.apiKey.trim()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents,
                generationConfig: {
                  temperature: config.temperature ?? 0.3,
                  maxOutputTokens: 1200,
                  responseMimeType: "application/json",
                },
              }),
            }
          )

          if (!res.ok) {
            let errDetail = `HTTP ${res.status}`
            try {
              const errData = (await res.json()) as { error?: { message?: string } }
              errDetail = errData.error?.message || errDetail
            } catch {
            }
            lastErrorDetail = errDetail
            if (res.status === 503 || res.status === 404) {
              continue
            }
            return { rawText: "", error: `Gemini API Error: ${errDetail}` }
          }

          const data = await res.json()
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
          return { rawText }
        } catch (fetchErr) {
          lastErrorDetail = fetchErr instanceof Error ? fetchErr.message : "Network error"
          continue
        }
      }

      return { rawText: "", error: `Gemini API Error: ${lastErrorDetail}` }
    }

    if (config.provider === "openai") {
      const model = config.model || "gpt-4o-mini"

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
        { role: "user", content: userPrompt },
      ]

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: config.temperature ?? 0.3,
          max_tokens: 1200,
        }),
      })

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`
        try {
          const errData = (await res.json()) as { error?: { message?: string } }
          errDetail = errData.error?.message || errDetail
        } catch {
        }
        return { rawText: "", error: `OpenAI API Error: ${errDetail}` }
      }

      const data = await res.json()
      const rawText = data.choices?.[0]?.message?.content || ""
      return { rawText }
    }

    if (config.provider === "groq") {
      const model = config.model || "llama-3.3-70b-versatile"

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
        { role: "user", content: userPrompt },
      ]

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: config.temperature ?? 0.3,
          max_tokens: 1200,
        }),
      })

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`
        try {
          const errData = (await res.json()) as { error?: { message?: string } }
          errDetail = errData.error?.message || errDetail
        } catch {
        }
        return { rawText: "", error: `Groq API Error: ${errDetail}` }
      }

      const data = await res.json()
      const rawText = data.choices?.[0]?.message?.content || ""
      return { rawText }
    }

    if (config.provider === "anthropic") {
      const model = config.model || "claude-3-5-sonnet-20241022"

      const messages = [
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
        { role: "user" as const, content: userPrompt },
      ]

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages,
          max_tokens: 1200,
          temperature: config.temperature ?? 0.3,
        }),
      })

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`
        try {
          const errData = (await res.json()) as { error?: { message?: string } }
          errDetail = errData.error?.message || errDetail
        } catch {
        }
        return { rawText: "", error: `Anthropic API Error: ${errDetail}` }
      }

      const data = await res.json()
      const rawText = data.content?.[0]?.text || ""
      return { rawText }
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Check internet connection"
    return { rawText: "", error: `Network connection failed: ${detail}` }
  }

  return { rawText: "", error: "Unsupported provider" }
}

export async function testLLMConnection(
  config: AIProviderConfig
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now()
  if (!config.apiKey?.trim()) {
    return { success: false, latencyMs: 0, error: "API key is required" }
  }

  try {
    const res = await queryRealLLM(
      "Ping: confirm connection in 5 words.",
      [],
      config,
      "Test mode: respond with valid JSON: {\"message\": \"Connected successfully\", \"action\": null}"
    )

    const latencyMs = Date.now() - startTime
    if (res.error) {
      return { success: false, latencyMs, error: res.error }
    }
    return { success: true, latencyMs }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed"
    return { success: false, latencyMs: Date.now() - startTime, error: msg }
  }
}
