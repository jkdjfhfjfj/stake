import { Link } from "wouter";
import { useState, useEffect } from "react";
import {
  TrendingUp, Shield, Users, Zap, ArrowRight, CheckCircle,
  Star, ChevronDown, Phone, Lock, BarChart3, Wallet,
  Clock, Gift, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Animated counter hook
function useCounter(target: number, duration = 2000, startOnMount = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!startOnMount && !started) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setStarted(true);
  }, [target, duration, startOnMount, started]);

  return count;
}

const plans = [
  {
    name: "Starter",
    duration: "30 Days",
    roi: "8%",
    min: "1,000",
    max: "4,999",
    tag: null,
    gradient: "from-[#0d2010] to-[#0a1a0d]",
    border: "border-green-900/40",
    badge: "bg-green-900/30 text-green-400",
    highlight: "text-green-400",
    features: ["M-Pesa deposits", "Daily interest accrual", "Early exit option", "Referral bonuses"],
  },
  {
    name: "Growth",
    duration: "90 Days",
    roi: "15%",
    min: "5,000",
    max: "19,999",
    tag: "Most Popular",
    gradient: "from-[#0a1f0d] to-[#071508]",
    border: "border-green-600/60",
    badge: "bg-green-700/30 text-green-300",
    highlight: "text-green-300",
    features: ["Everything in Starter", "Priority withdrawals", "Compounding option", "Dedicated support"],
  },
  {
    name: "Premium",
    duration: "180 Days",
    roi: "25%",
    min: "20,000",
    max: "Unlimited",
    tag: "Best Returns",
    gradient: "from-[#091a10] to-[#050f08]",
    border: "border-emerald-500/40",
    badge: "bg-emerald-900/30 text-emerald-400",
    highlight: "text-emerald-400",
    features: ["Everything in Growth", "Instant disbursements", "Dedicated account manager", "VIP referral rate"],
  },
];

const steps = [
  { n: "01", icon: Phone, title: "Create Account", desc: "Sign up in under 2 minutes with your email and set a password. No paperwork." },
  { n: "02", icon: Wallet, title: "Deposit via M-Pesa", desc: "Enter an amount, receive an STK push on your Safaricom number, confirm — done." },
  { n: "03", icon: BarChart3, title: "Choose a Plan", desc: "Pick a staking plan that matches your timeline and watch your KES grow daily." },
  { n: "04", icon: Gift, title: "Earn & Withdraw", desc: "Matured stakes are credited to your wallet. Withdraw to M-Pesa anytime." },
];

const testimonials = [
  { name: "James M.", loc: "Nairobi", text: "Started with KES 5,000 in the Growth plan — got back KES 5,750 in 90 days. Legit.", stars: 5 },
  { name: "Aisha K.", loc: "Mombasa", text: "The referral bonus alone paid for my phone bill. Amazing platform.", stars: 5 },
  { name: "Brian O.", loc: "Kisumu", text: "Dashboard is clean and deposits process in seconds. Highly recommend.", stars: 5 },
];

export default function LandingPage() {
  const tvl = useCounter(50_000_000);
  const investors = useCounter(2400);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#060d08] text-white overflow-x-hidden">
      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-green-900/20 bg-[#060d08] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/40">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">
              Stake<span className="text-green-400">KE</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <button onClick={() => scrollTo("plans")} className="hover:text-white transition-colors">Plans</button>
            <button onClick={() => scrollTo("how")} className="hover:text-white transition-colors">How it works</button>
            <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hidden sm:flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/30 font-semibold px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background radial accents — no blur, safe on all Android browsers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-green-900/8 rounded-full" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-emerald-900/6 rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-800/40 rounded-full px-4 py-1.5 text-sm text-green-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            🇰🇪 Kenya's Premier M-Pesa Staking Platform
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6">
            <span className="bg-gradient-to-br from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Grow Your KES.
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Earn Daily Returns.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deposit via <strong className="text-white">M-Pesa</strong>, pick a staking plan, and earn up to{" "}
            <strong className="text-green-400">25% ROI</strong>. Transparent. Kenyan. Built for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link href="/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-500 h-13 px-8 text-base font-bold shadow-xl shadow-green-950/50 group">
                Start Staking Today
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <button onClick={() => scrollTo("how")}
              className="flex items-center justify-center gap-2 h-13 px-8 text-base font-medium text-gray-400 hover:text-white border border-green-900/40 rounded-xl hover:border-green-700/50 transition-all">
              How It Works <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {[
              { value: `KES ${(tvl / 1_000_000).toFixed(0)}M+`, label: "Total Value Locked" },
              { value: `${investors.toLocaleString()}+`, label: "Active Investors" },
              { value: "Up to 25%", label: "Annual Returns" },
            ].map(({ value, label }) => (
              <div key={label} className="p-4 sm:p-5 rounded-2xl bg-green-900/10 border border-green-900/25 text-center">
                <div className="text-xl sm:text-3xl font-black text-green-400 mb-0.5">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────────────── */}
      <section className="border-y border-green-900/20 bg-green-950/10 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-gray-500">
          {[
            [Lock, "Encrypted & Secure"],
            [Phone, "M-Pesa Powered"],
            [Activity, "99.9% Uptime"],
            [Shield, "Full Audit Trail"],
            [Clock, "Instant Deposits"],
          ].map(([Icon, text]) => (
            <div key={text as string} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-green-600" />
              <span>{text as string}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Plans ──────────────────────────────────────────────────── */}
      <section id="plans" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-green-900/30 text-green-400 border-green-800/40 mb-4">Staking Plans</Badge>
            <h2 className="text-4xl font-black mb-3">Choose Your Plan</h2>
            <p className="text-gray-400 text-lg">Fixed returns, transparent terms. Pick the plan that fits your goals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl bg-gradient-to-b ${plan.gradient} border ${plan.border} p-7 flex flex-col group hover:scale-[1.02] transition-transform duration-200`}>
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {plan.tag}
                    </span>
                  </div>
                )}

                <div className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold mb-5 ${plan.badge}`}>
                  {plan.name}
                </div>

                <div className="mb-6">
                  <div className={`text-6xl font-black ${plan.highlight} leading-none`}>{plan.roi}</div>
                  <div className="text-gray-400 text-sm mt-1">guaranteed ROI</div>
                </div>

                <div className="space-y-2.5 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-white font-medium">{plan.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min. stake</span>
                    <span className="text-white font-medium">KES {plan.min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max. stake</span>
                    <span className="text-white font-medium">KES {plan.max}</span>
                  </div>
                </div>

                <div className="border-t border-green-900/30 pt-5 mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className={`w-3.5 h-3.5 ${plan.highlight} shrink-0`} />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <Link href="/register">
                    <Button className={`w-full font-bold ${plan.tag ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-950/50" : "bg-green-900/40 hover:bg-green-700/40 border border-green-800/40"}`}>
                      Stake {plan.name} →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Calculator teaser */}
          <div className="mt-10 rounded-2xl bg-green-900/10 border border-green-900/25 p-6 sm:p-8 max-w-2xl mx-auto text-center">
            <p className="text-gray-400 text-sm mb-1">Example: stake <strong className="text-white">KES 10,000</strong> on the Growth plan</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="text-center">
                <div className="text-2xl font-black text-white">10,000</div>
                <div className="text-xs text-gray-500">KES in</div>
              </div>
              <ArrowRight className="w-5 h-5 text-green-500" />
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">11,500</div>
                <div className="text-xs text-gray-500">KES after 90 days</div>
              </div>
              <span className="px-3 py-1 bg-green-900/30 rounded-full text-green-400 font-bold text-sm">+KES 1,500</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-green-950/5 border-y border-green-900/15">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-green-900/30 text-green-400 border-green-800/40 mb-4">Simple Process</Badge>
            <h2 className="text-4xl font-black mb-3">How StakeKE Works</h2>
            <p className="text-gray-400 text-lg">Four steps from sign-up to earning returns</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="group relative p-6 rounded-2xl bg-[#0a1408] border border-green-900/25 hover:border-green-700/40 transition-colors">
                <div className="absolute top-4 right-4 text-4xl font-black text-green-900/40 select-none">{n}</div>
                <div className="w-11 h-11 rounded-2xl bg-green-900/30 border border-green-800/30 flex items-center justify-center mb-4 group-hover:bg-green-800/30 transition-colors">
                  <Icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-green-900/30 text-green-400 border-green-800/40 mb-4">Platform Features</Badge>
            <h2 className="text-4xl font-black mb-3">Everything You Need</h2>
            <p className="text-gray-400 text-lg">Purpose-built for Kenyan investors</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp,
                color: "text-green-400",
                bg: "bg-green-900/20",
                title: "High Yield Returns",
                desc: "Earn 8% to 25% ROI depending on your chosen staking period. Returns are fixed and guaranteed."
              },
              {
                icon: Phone,
                color: "text-blue-400",
                bg: "bg-blue-900/20",
                title: "M-Pesa Integration",
                desc: "Instant deposits via Safaricom STK Push. Withdrawals land directly on your M-Pesa within minutes."
              },
              {
                icon: Users,
                color: "text-purple-400",
                bg: "bg-purple-900/20",
                title: "2-Tier Referrals",
                desc: "Earn 5% on tier-1 and 2% on tier-2 referrals. Build a passive income stream by sharing your code."
              },
              {
                icon: Shield,
                color: "text-orange-400",
                bg: "bg-orange-900/20",
                title: "Secure & Transparent",
                desc: "All transactions are recorded with full audit trails. Your data and funds are always protected."
              },
              {
                icon: BarChart3,
                color: "text-cyan-400",
                bg: "bg-cyan-900/20",
                title: "Live Portfolio Tracking",
                desc: "Real-time dashboard showing your active stakes, earnings progress, and transaction history."
              },
              {
                icon: Clock,
                color: "text-yellow-400",
                bg: "bg-yellow-900/20",
                title: "Flexible Staking",
                desc: "Early exit options available with defined penalty terms. No lock-ins without clear terms."
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl bg-[#0a1408] border border-green-900/20 hover:border-green-800/30 transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${f.bg} border border-green-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-green-950/5 border-y border-green-900/15">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-green-900/30 text-green-400 border-green-800/40 mb-4">Trusted by Kenyans</Badge>
            <h2 className="text-4xl font-black mb-3">What Our Users Say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-[#0a1408] border border-green-900/25">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-800/30 flex items-center justify-center text-xs font-bold text-green-400">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-green-900/8 rounded-full" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-950/50">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Ready to Grow<br />
            <span className="text-green-400">Your Money?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Join 2,400+ Kenyans already earning daily returns on StakeKE.
            Create your free account in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-500 h-14 px-10 text-lg font-black shadow-2xl shadow-green-950/60 group">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-green-800/50 text-gray-300 hover:text-white hover:bg-green-900/20 h-14 px-10 text-base">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-4">No fees to sign up. Withdraw anytime. Invest responsibly.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-green-900/20 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg">Stake<span className="text-green-400">KE</span></span>
          </div>
          <p className="text-gray-600 text-sm text-center">
            © {new Date().getFullYear()} StakeKE. All rights reserved. Invest responsibly.
          </p>
          <div className="flex gap-5 text-sm text-gray-500">
            <button onClick={() => scrollTo("plans")} className="hover:text-gray-300">Plans</button>
            <button onClick={() => scrollTo("how")} className="hover:text-gray-300">How it Works</button>
            <Link href="/login" className="hover:text-gray-300">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
