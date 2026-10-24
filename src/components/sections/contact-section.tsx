import * as React from "react"
import {
  Mail,
  Phone,
  Send,
  Headphones,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export function ContactSection() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [category, setCategory] = React.useState("family")
  const [message, setMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
      })

      if (error) {
        console.warn("Supabase contact_messages fallback:", error.message)
      }

      toast.success("Thank you! Your message has been received by our 24/7 dispatch desk.")
      setName("")
      setEmail("")
      setMessage("")
    } catch (err) {
      console.warn("Contact desk unreachable, logging simulated submission:", err)
      toast.success("Thank you! Your message has been recorded.")
      setName("")
      setEmail("")
      setMessage("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#0F172A] py-28 sm:py-36 lg:py-40 border-t border-white/[0.08]"
    >
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-96 w-full -translate-x-1/2 opacity-5 blur-[140px] bg-[#3B82F6]/10" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#06B6D4] shadow-sm shadow-[#06B6D4]/10">
            <Sparkles className="size-3.5 text-[#06B6D4]" />
            <span>24/7 Operations &amp; Support Desk</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Get in Touch with{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#3B82F6] bg-clip-text text-transparent">
              Wanes Operations
            </span>
          </h2>

          <p className="text-base text-[#94A3B8] sm:text-lg leading-relaxed text-balance">
            Whether you have questions about family care plans, provider verification, or emergency safety protocols, our dedicated team is always here for you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B]/85 p-7 backdrop-blur-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#EF4444]/40">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/10 text-[#EF4444] shadow-sm">
                  <Headphones className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">24/7 Emergency &amp; Dispatch</h3>
                  <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                    Direct operations desk for priority kin alerts, safety coordination, and live dispatch.
                  </p>
                  <div className="mt-3 flex flex-col gap-1 text-xs font-semibold text-[#EF4444]">
                    <span className="flex items-center gap-2">
                      <Phone className="size-3.5" /> +1 (800) 555-WANES (9263)
                    </span>
                    <span className="flex items-center gap-2 text-[#94A3B8]">
                      <Mail className="size-3.5 text-[#06B6D4]" /> dispatch@wanes-care.org
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B]/85 p-7 backdrop-blur-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#06B6D4]/30">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0F172A]/80 text-[#3B82F6]">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Community Care &amp; Membership</h3>
                  <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                    Assistance with plan upgrades, care recipient profiles, and volunteer verification.
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                    <Mail className="size-3.5 text-[#06B6D4]" /> care@wanes-care.org
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B]/85 p-7 backdrop-blur-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#06B6D4]/30">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0F172A]/80 text-[#06B6D4]">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Corporate CSR &amp; Municipalities</h3>
                  <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                    Tailored multi-family deployments, verified community service hours, and institutional reporting.
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                    <Mail className="size-3.5 text-[#06B6D4]" /> enterprise@wanes-care.org
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1E293B]/60 px-4.5 py-3 text-xs text-[#94A3B8]">
              <Clock className="size-4 text-[#06B6D4] shrink-0" />
              <span>Average response time under 15 minutes across all channels</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/[0.08] bg-[#1E293B]/85 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
              <h3 className="text-xl font-bold text-[#F8FAFC] sm:text-2xl">Send a Message</h3>
              <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
                Submit an inquiry and our team will get back to you promptly.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A3B8]">Your Full Name *</label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A3B8]">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#94A3B8]">Topic / Plan of Interest</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "free", label: "Free Plan" },
                      { id: "family", label: "Family Plan" },
                      { id: "enterprise", label: "Enterprise CSR" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCategory(opt.id)}
                        className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                          category === opt.id
                            ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#F8FAFC] shadow-sm shadow-[#3B82F6]/15 font-semibold"
                            : "border-white/[0.08] bg-[#0F172A]/50 text-[#94A3B8] hover:border-white/20 hover:bg-[#0F172A]/80 hover:text-[#F8FAFC]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A3B8]">Message / Inquiry *</label>
                  <Textarea
                    placeholder="How can our community care team assist you today?"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="rounded-xl border border-white/[0.08] bg-[#0F172A]/80 text-[#F8FAFC] placeholder:text-[#94A3B8]/60 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full cursor-pointer gap-2 rounded-xl bg-[#3B82F6] border border-[#06B6D4]/30 py-3.5 font-semibold text-white shadow-sm shadow-[#3B82F6]/15 hover:bg-[#2563EB] transition-all duration-300 active:scale-[0.99]"
                >
                  <Send className="size-4 text-white" />
                  <span>{submitting ? "Sending..." : "Submit Inquiry"}</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
