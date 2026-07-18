import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAppAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import StakingPlansPage from "@/pages/staking-plans";
import TransactionsPage from "@/pages/transactions";
import ReferralsPage from "@/pages/referrals";
import NotificationsPage from "@/pages/notifications";
import AdminPage from "@/pages/admin/index";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import BlogIndex from "@/pages/blog/index";
import HowToInvestMpesa from "@/pages/blog/how-to-invest-mpesa-kenya";
import StakingPlansRoiExplained from "@/pages/blog/staking-plans-roi-explained";
import EarnReferralRewards from "@/pages/blog/earn-referral-rewards-kenya";
import MpesaOnlineInvestmentSafety from "@/pages/blog/mpesa-online-investment-safety";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAppAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAppAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/admin-login" />;
  if (user.role !== "ADMIN") return <Redirect to="/dashboard" />;
  return <Component />;
}

function HomeRedirect() {
  const { user, loading } = useAppAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0f0d]" />;
  return user ? <Redirect to="/dashboard" /> : <LandingPage />;
}

function AdminLoginPage() {
  const { user, loading } = useAppAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0f0d]" />;
  if (user?.role === "ADMIN") return <Redirect to="/admin" />;

  return (
    <div className="min-h-screen bg-[#070d09] flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-green-400 font-bold text-lg">StakeKE Admin</span>
      </div>
      <LoginPage />
      <p className="text-xs text-gray-600 -mt-4">Admin access only. Unauthorised access is prohibited.</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/staking" component={() => <ProtectedRoute component={StakingPlansPage} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={TransactionsPage} />} />
      <Route path="/referrals" component={() => <ProtectedRoute component={ReferralsPage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/admin" component={() => <AdminRoute component={AdminPage} />} />
      {/* /sign-up alias → /register (preserves ?ref= for referral links) */}
      <Route path="/sign-up" component={() => {
        const params = window.location.search;
        window.location.replace(`/register${params}`);
        return null;
      }} />
      {/* Public blog / SEO articles */}
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/how-to-invest-mpesa-kenya" component={HowToInvestMpesa} />
      <Route path="/blog/staking-plans-roi-explained" component={StakingPlansRoiExplained} />
      <Route path="/blog/earn-referral-rewards-kenya" component={EarnReferralRewards} />
      <Route path="/blog/mpesa-online-investment-safety" component={MpesaOnlineInvestmentSafety} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
