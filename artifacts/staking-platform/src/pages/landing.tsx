import { Link } from "wouter";
import { TrendingUp, Shield, Users, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: TrendingUp, title: "High Yield Returns", desc: "Earn up to 25% ROI on your KES investments with flexible staking periods." },
  { icon: Shield, title: "Secure & Transparent", desc: "All transactions tracked on-platform with full audit trails." },
  { icon: Users, title: "Earn from Referrals", desc: "5% on tier-1 referrals, 2% on tier-2. Build passive income by sharing." },
  { icon: Zap, title: "M-Pesa Powered", desc: "Instant deposits via STK Push. Withdrawals disbursed directly to your phone." },
];

const plans = [
  { name: "Starter", duration: "30 Days", roi: "8%", min: "1,000", color: "from-green-900/40 to-green-800/20" },
  { name: "Growth", duration: "90 Days", roi: "15%", min: "5,000", color: "from-emerald-900/40 to-emerald-800/20", popular: true },
  { name: "Premium", duration: "180 Days", roi: "25%", min: "20,000", color: "from-teal-900/40 to-teal-800/20" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      {/* Nav */}
      <nav className="border-b border-green-900/30 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-green-400">StakeKE</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-green-300 hover:text-green-100">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-green-600 hover:bg-green-500 text-white">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-green-900/40 text-green-300 border border-green-700/50 px-4 py-1">
          🇰🇪 Kenya's Premier Staking Platform
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-green-300 bg-clip-text text-transparent leading-tight">
          Grow Your Money<br />with Smart Staking
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Invest KES via M-Pesa, earn guaranteed returns, and build a referral network. Simple, transparent, Kenyan.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8 h-12 text-base">
              Start Staking <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="border-green-700 text-green-300 hover:bg-green-900/30 px-8 h-12 text-base">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-3 gap-6">
        {[["KES 50M+", "Total Value Locked"], ["2,400+", "Active Investors"], ["Up to 25%", "Annual Returns"]].map(([val, label]) => (
          <div key={label} className="text-center p-6 rounded-2xl bg-green-900/20 border border-green-900/30">
            <div className="text-3xl font-bold text-green-400 mb-1">{val}</div>
            <div className="text-sm text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-3">Staking Plans</h2>
        <p className="text-gray-400 text-center mb-10">Choose the plan that fits your investment horizon</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl bg-gradient-to-b ${plan.color} border border-green-900/40 p-6`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white">Most Popular</Badge>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="text-4xl font-bold text-green-400 my-4">{plan.roi} <span className="text-lg text-gray-400">ROI</span></div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span>{plan.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Min. Investment</span>
                  <span>KES {plan.min}</span>
                </div>
              </div>
              <Link href="/sign-up">
                <Button className="w-full bg-green-600 hover:bg-green-500">Stake Now</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="flex gap-4 p-6 rounded-2xl bg-green-900/10 border border-green-900/20">
            <div className="w-10 h-10 rounded-xl bg-green-900/40 flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-green-900/30 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 StakeKE. All rights reserved. Invest responsibly.</p>
      </footer>
    </div>
  );
}
