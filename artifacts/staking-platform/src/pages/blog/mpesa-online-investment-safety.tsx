import { Link } from "wouter";
import { TrendingUp, ArrowLeft, ArrowRight, Shield, CheckCircle, XCircle, Lock, Eye } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

export default function MpesaOnlineInvestmentSafety() {
  useSeo({
    title: "Is Online M-Pesa Investment Safe? What to Look For in Kenya | StakeKE",
    description: "A practical guide to evaluating online investment platforms in Kenya — what red flags to avoid, and what makes StakeKE transparent and secure.",
    type: "article",
    datePublished: "2026-07-17T00:00:00Z",
  });
  return (
    <div className="min-h-screen bg-[#060d08]">
      <div className="border-b border-green-900/20 bg-[#080f0a]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-white text-lg">Stake<span className="text-green-400">KE</span></span>
            </div>
          </Link>
          <span className="text-gray-600">/</span>
          <Link href="/blog"><span className="text-gray-400 text-sm hover:text-white cursor-pointer">Investment Guide</span></Link>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog">
          <div className="inline-flex items-center gap-2 text-gray-500 hover:text-green-400 text-sm mb-8 cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to guides
          </div>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full">Safety & Trust</span>
          <span className="text-xs text-gray-600">7 min read · July 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
          Is Online M-Pesa Investment Safe?<br />
          <span className="text-green-400">What to Look For in Kenya</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10">
          Kenya's M-Pesa ecosystem has made it easy for anyone to invest — but it's also attracted scammers. This guide helps you separate legitimate platforms from fraudulent ones, and explains exactly what makes StakeKE trustworthy.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">The Kenyan Investment Scam Problem</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Thousands of Kenyans lose money every year to fraudulent investment schemes. They typically promise extremely high returns (50–200% monthly), have no verifiable contact information, and disappear with funds after reaching a critical mass. WhatsApp groups have become a primary vector for these schemes.
          </p>
          <p className="text-gray-400 leading-relaxed">
            That doesn't mean all online investment platforms are scams. It means you need a clear checklist to evaluate any platform before sending money.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Red Flags: Walk Away Immediately</h2>
          <div className="space-y-3">
            {[
              "Promises of 50%+ returns per month — mathematically unsustainable.",
              "No phone number, physical address, or named support contact.",
              "Payments only via personal M-Pesa till numbers (not a business till).",
              "Withdrawal requests always 'pending' or blocked by 'fees' you must pay first.",
              "Zero information about how investments generate returns.",
              "Heavy pressure to recruit before you can withdraw.",
              "Anonymous admin — no named founders or team.",
            ].map((flag, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-900/10 border border-red-900/20 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300/80 text-sm">{flag}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Green Flags: Signs of a Legitimate Platform</h2>
          <div className="space-y-3">
            {[
              "Realistic ROI percentages — legitimate platforms pay 5–30% per plan, not per month.",
              "Transparent plan details: ROI, duration, lock periods, and penalties all stated clearly upfront.",
              "Live, accessible support via WhatsApp or email with fast response times.",
              "Real M-Pesa STK Push integration (Safaricom's official payment gateway).",
              "A transaction history you can view and verify at any time.",
              "Clear terms for early withdrawal — not a blanket 'no refund' policy.",
              "Public platform statistics (TVL, active investors) showing genuine activity.",
            ].map((flag, i) => (
              <div key={i} className="flex items-start gap-3 bg-green-900/10 border border-green-900/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-green-300/80 text-sm">{flag}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">How StakeKE Meets the Trust Bar</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, color: "text-green-400", bg: "bg-green-900/30", title: "Official M-Pesa Integration", body: "Deposits use Safaricom's official STK Push API (PayHero). Your money goes to a verified business till, not a personal number." },
              { icon: Eye, color: "text-blue-400", bg: "bg-blue-900/30", title: "Full Transaction Transparency", body: "Every deposit, stake, maturity, and withdrawal is logged in your transaction history. Nothing is hidden." },
              { icon: Lock, color: "text-yellow-400", bg: "bg-yellow-900/30", title: "Secure Authentication", body: "Email + password login with JWT-based sessions. Your account is protected — no sharing of credentials required." },
              { icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-900/30", title: "Realistic Returns", body: "StakeKE's plan ROIs are sustainable and stated clearly — no misleading promises of overnight wealth." },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${v.bg}`}>
                    <Icon className={`w-4 h-4 ${v.color}`} />
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{v.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{v.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Practical Safety Rules for Any Online Investment</h2>
          <div className="space-y-3">
            {[
              "Never invest money you cannot afford to lose — treat every new platform cautiously until you've successfully withdrawn.",
              "Start with the minimum — test the deposit and withdrawal cycle before investing a significant amount.",
              "Never share your account password or M-Pesa PIN with anyone, even support staff.",
              "Verify that the withdrawal you requested actually arrives in your M-Pesa before reinvesting returns.",
              "If promised returns sound too good to be true, they almost certainly are.",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-br from-green-900/20 to-green-900/10 border border-green-800/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Invest with Confidence on StakeKE</h2>
          <p className="text-gray-400 text-sm mb-6">Transparent plans, official M-Pesa integration, and real support. Start with as little as KES 500.</p>
          <Link href="/register">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-green-900/20">
          <Link href="/blog/earn-referral-rewards-kenya">
            <div className="text-gray-400 hover:text-white text-sm flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Earn with Referrals
            </div>
          </Link>
        </div>
      </article>
    </div>
  );
}
