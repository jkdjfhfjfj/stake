import { Link } from "wouter";
import { TrendingUp, ArrowLeft, ArrowRight, Calculator, Clock, Shield, Zap } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

export default function StakingPlansRoiExplained() {
  useSeo({
    title: "Staking Plans & ROI Explained for Kenyan Investors | StakeKE",
    description: "Understand how tiered staking plans work, how ROI is calculated in KES, and how to pick the right plan for your investment goals in Kenya.",
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
          <span className="text-xs font-semibold text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full">Investment Guide</span>
          <span className="text-xs text-gray-600">6 min read · July 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
          Staking Plans & ROI Explained:<br />
          <span className="text-green-400">What Every Kenyan Investor Should Know</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10">
          Choosing the right staking plan is the single most important decision you'll make on StakeKE. This guide breaks down exactly how ROI works, what the lock period means, and how to pick the plan that matches your goals.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">What Is a Staking Plan?</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            A staking plan is a fixed-term investment product. You lock in a KES amount for a set number of days, and at the end of the term, you receive your original amount back plus a percentage return (the ROI).
          </p>
          <p className="text-gray-400 leading-relaxed">
            Unlike a savings account that pays a tiny annual percentage, staking plans on StakeKE pay a <strong className="text-white">total return over the plan's specific duration</strong> — so a 15% ROI on a 30-day plan means you earn 15% in 30 days, not per year.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">The Key Variables in Every Plan</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, color: "text-green-400", bg: "bg-green-900/30", label: "ROI %", desc: "The total percentage return you earn on your stake when the plan matures. A 20% ROI on KES 10,000 = KES 2,000 profit." },
              { icon: Clock, color: "text-blue-400", bg: "bg-blue-900/30", label: "Duration (Days)", desc: "How long your money is staked. Shorter plans free up capital faster; longer plans often have higher ROI." },
              { icon: Shield, color: "text-orange-400", bg: "bg-orange-900/30", label: "Lock Period", desc: "The minimum number of days before you can withdraw your principal early. After the lock period, you may exit — but with a penalty." },
              { icon: Zap, color: "text-red-400", bg: "bg-red-900/30", label: "Early Withdrawal Penalty", desc: "The % deducted from your principal if you break a stake before it matures. Avoid triggering this — plan your liquidity needs first." },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.label} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${v.bg}`}>
                    <Icon className={`w-4 h-4 ${v.color}`} />
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{v.label}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">How ROI Is Calculated — A Real Example</h2>
          <div className="bg-[#0d1a10] border border-green-900/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Example: 30-Day Plan at 15% ROI</span>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: "Amount staked", value: "KES 10,000", color: "text-white" },
                { label: "Plan ROI", value: "15%", color: "text-green-400" },
                { label: "Plan duration", value: "30 days", color: "text-blue-400" },
                { label: "Profit earned", value: "KES 1,500", color: "text-yellow-400" },
                { label: "Total returned after 30 days", value: "KES 11,500", color: "text-green-400 font-bold text-base" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-green-900/10 last:border-0">
                  <span className="text-gray-400">{row.label}</span>
                  <span className={row.color}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">* ROI is total return for the plan duration, not annualised.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">How to Pick the Right Plan</h2>
          <div className="space-y-4">
            {[
              { title: "If you need flexibility soon", body: "Choose a shorter-duration plan (7–14 days). You'll access your money faster, even if the ROI is slightly lower. Never stake more than you can afford to lock." },
              { title: "If you want to maximise returns", body: "Go for longer-duration plans with higher ROI. The longer the lock, the higher the reward — ideal if you won't need the funds for 30–90 days." },
              { title: "If you're starting out", body: "Start with the minimum on a short plan. See how the process works, confirm your returns arrive correctly, then scale up." },
              { title: "If you want compound growth", body: "When a plan matures, immediately restake the full amount (principal + ROI) into the next plan. This compounds your returns over time." },
            ].map((tip, i) => (
              <div key={i} className="border-l-2 border-green-700/50 pl-4">
                <p className="font-semibold text-white text-sm mb-1">{tip.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Early Withdrawal — What You Need to Know</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Every plan has an early withdrawal penalty (typically 5–15% of principal). This is deducted if you break a stake before it matures.
          </p>
          <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 text-sm text-red-300">
            <strong>Example:</strong> You stake KES 10,000 for 30 days. On day 10 you need the money. If the penalty is 10%, you get back KES 9,000 — a KES 1,000 loss on your principal. Only break a stake if absolutely necessary.
          </div>
        </section>

        <div className="bg-gradient-to-br from-green-900/20 to-green-900/10 border border-green-800/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">See Current Staking Plans</h2>
          <p className="text-gray-400 text-sm mb-6">Browse live plans with real ROI rates, durations, and minimums.</p>
          <Link href="/register">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-green-900/20 flex flex-col sm:flex-row gap-4">
          <Link href="/blog/how-to-invest-mpesa-kenya">
            <div className="text-gray-400 hover:text-white text-sm flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> How to Invest via M-Pesa
            </div>
          </Link>
          <Link href="/blog/earn-referral-rewards-kenya">
            <div className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-2 cursor-pointer sm:ml-auto">
              Earn with Referrals <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </article>
    </div>
  );
}
