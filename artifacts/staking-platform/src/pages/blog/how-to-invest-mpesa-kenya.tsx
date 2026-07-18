import { Link } from "wouter";
import { TrendingUp, ArrowLeft, CheckCircle, Smartphone, Wallet, Clock, ArrowRight } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

export default function HowToInvestMpesa() {
  useSeo({
    title: "How to Invest via M-Pesa in Kenya — Step-by-Step Guide | StakeKE",
    description: "Learn exactly how to deposit money through M-Pesa STK Push, pick a staking plan, and start earning daily returns in Kenya — no bank account needed.",
    type: "article",
    datePublished: "2026-07-17T00:00:00Z",
  });
  return (
    <div className="min-h-screen bg-[#060d08]">
      {/* Header */}
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
        {/* Back */}
        <Link href="/blog">
          <div className="inline-flex items-center gap-2 text-gray-500 hover:text-green-400 text-sm mb-8 cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to guides
          </div>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold text-green-400 bg-green-900/30 px-3 py-1 rounded-full">Getting Started</span>
          <span className="text-xs text-gray-600">5 min read · July 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
          How to Invest via M-Pesa in Kenya —<br />
          <span className="text-green-400">Step-by-Step Guide</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10">
          M-Pesa has transformed how Kenyans handle money — and now it's powering a new wave of accessible investing. Here's exactly how to deposit, stake, and start earning daily returns on StakeKE, no bank account required.
        </p>

        {/* Intro */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Why M-Pesa Investment Is Different</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Traditional investments in Kenya — fixed deposits, unit trusts, government bonds — all require a bank account, hefty paperwork, and often a minimum of KES 100,000 or more. M-Pesa investing removes every one of those barriers.
          </p>
          <p className="text-gray-400 leading-relaxed">
            With StakeKE, you can start with as little as <strong className="text-white">KES 500</strong>, deposit directly from your Safaricom M-Pesa line via STK Push, and begin earning returns the same day. The entire process takes under 3 minutes.
          </p>
        </section>

        {/* Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-6">Step-by-Step: How to Start</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                icon: Smartphone,
                title: "Create Your StakeKE Account",
                body: "Go to stakekenya.co.ke and click 'Get Started'. Register with your email and a password. During onboarding, enter your M-Pesa phone number (the Safaricom line you'll use to deposit). This is the number that will receive the STK Push prompt.",
              },
              {
                step: "2",
                icon: Wallet,
                title: "Make Your First Deposit via M-Pesa",
                body: "On your dashboard, click 'Deposit'. Enter the amount in KES. Within seconds, your phone will receive an M-Pesa STK Push — a pop-up asking you to enter your M-Pesa PIN. Enter your PIN, confirm, and the funds will reflect in your StakeKE balance within 1–3 minutes.",
              },
              {
                step: "3",
                icon: TrendingUp,
                title: "Choose a Staking Plan",
                body: "Navigate to the 'Stake' tab. You'll see plans with different ROI percentages and durations. Shorter plans offer faster access to your money; longer plans typically offer higher returns. Select a plan, enter the amount you want to stake, and confirm.",
              },
              {
                step: "4",
                icon: Clock,
                title: "Wait for Your Returns to Mature",
                body: "Once staked, your investment runs automatically. When the plan duration ends, your principal plus ROI is credited to your available balance. You can then restake, withdraw to M-Pesa, or leave it earning.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex gap-4 bg-[#0d1a10] border border-green-900/20 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-green-400" />
                      <h3 className="font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tips */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Pro Tips for New Investors</h2>
          <div className="space-y-3">
            {[
              "Start small — stake KES 500–1,000 on a short-term plan first to see how the process works before investing more.",
              "Always use the M-Pesa number linked to your StakeKE profile. Deposits from other numbers take longer to match.",
              "Set up your bank account details in your profile before requesting a large withdrawal — it speeds up processing.",
              "Use your referral link to earn 5% commission on every friend who deposits and stakes.",
              "Check the platform's public stats on the landing page for live TVL and active investor counts as a trust signal.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Common Questions</h2>
          <div className="space-y-4">
            {[
              { q: "What if M-Pesa debited me but my balance wasn't credited?", a: "Wait up to 10 minutes — the payment confirmation can be delayed. If it doesn't resolve, contact support via WhatsApp with your M-Pesa transaction code (e.g. QHX1234ABCD). It will be resolved manually." },
              { q: "Can I invest without a smartphone?", a: "You need a smartphone to access the StakeKE dashboard, but the M-Pesa STK Push works on any Safaricom line." },
              { q: "What's the minimum I can deposit?", a: "Check the current staking plans — the minimum depends on the plan you choose, starting from as low as KES 500 on entry-level plans." },
              { q: "How long do withdrawals take?", a: "M-Pesa withdrawals are processed within 24 hours, usually much faster. You'll get a notification when done." },
            ].map((faq, i) => (
              <div key={i} className="border border-green-900/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-2">{faq.q}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-900/10 border border-green-800/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Start Investing in 3 Minutes</h2>
          <p className="text-gray-400 text-sm mb-6">No bank account needed. Deposit via M-Pesa and earn daily returns in KES.</p>
          <Link href="/register">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Read more */}
        <div className="mt-10 pt-8 border-t border-green-900/20">
          <p className="text-sm text-gray-500 mb-4">Continue reading:</p>
          <Link href="/blog/staking-plans-roi-explained">
            <div className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-2 cursor-pointer">
              Staking Plans & ROI Explained <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </article>
    </div>
  );
}
