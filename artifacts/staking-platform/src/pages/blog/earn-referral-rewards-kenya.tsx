import { Link } from "wouter";
import { TrendingUp, ArrowLeft, ArrowRight, Users, Share2, DollarSign, Copy } from "lucide-react";

export default function EarnReferralRewards() {
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
          <span className="text-xs font-semibold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">Referrals</span>
          <span className="text-xs text-gray-600">4 min read · July 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
          Earn More with Referrals:<br />
          <span className="text-green-400">Kenya's 2-Tier Reward System Explained</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10">
          StakeKE's referral programme is one of the most generous in Kenya — you earn a percentage of every deposit made by people you refer, and even a percentage from <em>their</em> referrals. Here's exactly how it works.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">How the 2-Tier System Works</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-800/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                <span className="font-bold text-white">Tier 1 — Direct Referrals</span>
              </div>
              <p className="text-3xl font-black text-green-400 mb-1">5%</p>
              <p className="text-gray-400 text-sm">of every deposit your direct referrals make. Someone deposits KES 10,000 → you earn KES 500, instantly.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-800/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="font-bold text-white">Tier 2 — Indirect Referrals</span>
              </div>
              <p className="text-3xl font-black text-purple-400 mb-1">2%</p>
              <p className="text-gray-400 text-sm">of deposits made by people your referrals refer. Passive income that scales without extra work.</p>
            </div>
          </div>

          <div className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Example: Your referral network earning</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">You refer 5 friends, each deposits KES 5,000</span><span className="text-green-400 font-semibold">+KES 1,250</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Those 5 friends each refer 2 people (KES 3,000 each)</span><span className="text-purple-400 font-semibold">+KES 600</span></div>
              <div className="border-t border-green-900/20 pt-2 flex justify-between"><span className="text-white font-semibold">Total referral earnings</span><span className="text-yellow-400 font-bold text-base">KES 1,850</span></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">* without personally investing a single extra shilling</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">How to Share Your Referral Link</h2>
          <div className="space-y-4">
            {[
              { icon: Copy, step: "1", title: "Get Your Unique Link", body: "Go to Profile → Referral Code & Link. Copy your unique link (e.g. stakekenya.co.ke/register?ref=YOURCODE). Anyone who registers through this link is automatically linked to your account." },
              { icon: Share2, step: "2", title: "Share It Everywhere", body: "WhatsApp groups, Facebook, Twitter/X, TikTok, church groups, chamas — anywhere Kenyans talk about money. The more you share, the more you earn." },
              { icon: Users, step: "3", title: "Help Them Get Started", body: "Referrals who actually deposit and stake are what trigger your commission. Send them this guide so they know exactly what to do — it maximises your chances of earning." },
              { icon: DollarSign, step: "4", title: "Watch Your Commissions Arrive", body: "Referral rewards are credited to your available balance instantly when your referrals deposit. Check the Referrals page for a live breakdown of your network and earnings." },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex gap-4 bg-[#0d1a10] border border-green-900/20 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Best Channels to Share in Kenya</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { channel: "WhatsApp Groups", tip: "Chamas, neighbourhood groups, alumni groups — these are high-trust environments perfect for word-of-mouth investment tips." },
              { channel: "Facebook", tip: "Kenya has millions of active Facebook users. A personal testimonial post about your earnings gets high engagement." },
              { channel: "TikTok / YouTube", tip: "Short videos showing real earnings screenshots attract huge audiences. 'How I made KES 5,000 extra this month' is highly shareable content." },
              { channel: "Church / Mosque Communities", tip: "Savings and investment groups within religious communities are highly receptive to transparent platforms." },
            ].map((c) => (
              <div key={c.channel} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4">
                <p className="font-semibold text-white text-sm mb-1">📱 {c.channel}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{c.tip}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-br from-purple-900/20 to-green-900/10 border border-purple-800/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Start Earning Referral Commissions Today</h2>
          <p className="text-gray-400 text-sm mb-6">Create your account, get your unique link, and start building passive income.</p>
          <Link href="/register">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Get My Referral Link <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-green-900/20 flex flex-col sm:flex-row gap-4">
          <Link href="/blog/staking-plans-roi-explained">
            <div className="text-gray-400 hover:text-white text-sm flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Staking Plans & ROI
            </div>
          </Link>
          <Link href="/blog/mpesa-online-investment-safety">
            <div className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-2 cursor-pointer sm:ml-auto">
              Is Online Investing Safe? <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </article>
    </div>
  );
}
