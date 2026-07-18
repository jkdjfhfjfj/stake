import { Link } from "wouter";
import { ArrowRight, Clock, TrendingUp, Shield, Users, Smartphone } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const articles = [
  {
    slug: "how-to-invest-mpesa-kenya",
    title: "How to Invest via M-Pesa in Kenya — Step-by-Step Guide",
    description: "Learn exactly how to deposit money through M-Pesa STK Push, pick a staking plan, and start earning daily returns in Kenya — no bank account needed.",
    category: "Getting Started",
    readTime: "5 min read",
    icon: Smartphone,
    iconColor: "text-green-400",
    iconBg: "bg-green-900/30",
    date: "July 2026",
  },
  {
    slug: "staking-plans-roi-explained",
    title: "Staking Plans & ROI Explained: What Every Kenyan Investor Should Know",
    description: "Understand how tiered staking plans work, how ROI is calculated in KES, and how to pick the right plan for your investment goals.",
    category: "Investment Guide",
    readTime: "6 min read",
    icon: TrendingUp,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-900/30",
    date: "July 2026",
  },
  {
    slug: "earn-referral-rewards-kenya",
    title: "Earn More with Referrals: Kenya's 2-Tier Reward System Explained",
    description: "StakeKE's referral program pays 5% on tier-1 and 2% on tier-2. Here's exactly how to maximise your passive income by referring friends.",
    category: "Referrals",
    readTime: "4 min read",
    icon: Users,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-900/30",
    date: "July 2026",
  },
  {
    slug: "mpesa-online-investment-safety",
    title: "Is Online M-Pesa Investment Safe? What to Look For in Kenya",
    description: "A practical guide to evaluating online investment platforms in Kenya — what red flags to avoid, what makes StakeKE transparent and secure.",
    category: "Safety & Trust",
    readTime: "7 min read",
    icon: Shield,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-900/30",
    date: "July 2026",
  },
];

export default function BlogIndex() {
  useSeo({
    title: "Kenya M-Pesa Investment Guide — Learn to Grow Your Money | StakeKE",
    description: "Expert guides on M-Pesa investing, staking plans, referrals, and financial safety — written for Kenyan investors by StakeKE.",
  });
  return (
    <div className="min-h-screen bg-[#060d08]">
      {/* Header */}
      <div className="border-b border-green-900/20 bg-[#080f0a]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-white text-lg">Stake<span className="text-green-400">KE</span></span>
            </div>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">Investment Guide</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-800/30 rounded-full px-4 py-1.5 text-xs text-green-400 font-medium mb-6">
            🇰🇪 Kenya's M-Pesa Investment Guide
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Learn to Grow Your Money<br />
            <span className="text-green-400">with M-Pesa in Kenya</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Expert guides on M-Pesa investing, staking plans, referrals, and financial safety — written for Kenyan investors.
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {articles.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.slug} href={`/blog/${a.slug}`}>
                <div className="group bg-[#0d1a10] border border-green-900/20 rounded-2xl p-6 hover:border-green-700/40 hover:bg-[#0f1f12] transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.iconBg}`}>
                      <Icon className={`w-5 h-5 ${a.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{a.category}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{a.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug mb-3 group-hover:text-green-300 transition-colors">
                    {a.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{a.description}</p>
                  <div className="mt-5 flex items-center gap-1 text-green-400 text-sm font-medium">
                    Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-green-900/20 to-green-900/10 border border-green-800/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Ready to Start Investing?</h2>
          <p className="text-gray-400 text-sm mb-6">Join thousands of Kenyans earning returns via M-Pesa on StakeKE.</p>
          <Link href="/register">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Create Free Account →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
