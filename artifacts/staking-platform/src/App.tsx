import { useEffect } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ClerkProvider, SignIn, SignUp, Show, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import StakingPlansPage from "@/pages/staking-plans";
import TransactionsPage from "@/pages/transactions";
import ReferralsPage from "@/pages/referrals";
import NotificationsPage from "@/pages/notifications";
import AdminPage from "@/pages/admin/index";
import NotFound from "@/pages/not-found";

const _hostname = window.location.hostname;
const _isLocalhost = _hostname === "localhost" || _hostname === "127.0.0.1";
const clerkPubKey = _isLocalhost
  ? (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "")
  : publishableKeyFromHost(_hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const appearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#16a34a",
    colorBackground: "#0a0f0d",
    colorInputBackground: "#111a14",
    colorText: "#e5f0e8",
    borderRadius: "0.75rem",
    fontFamily: "Inter, sans-serif",
  },
  elements: {
    card: "shadow-xl border border-green-900/40",
    formButtonPrimary: "bg-green-600 hover:bg-green-500",
  },
};

function ClerkTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => { setAuthTokenGetter(null); };
  }, [getToken]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/admin-login" />
      </Show>
    </>
  );
}

function AdminLoginPage() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/admin" />
      </Show>
      <Show when="signed-out">
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#070d09] gap-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-green-400 font-bold text-lg">StakeKE Admin</span>
          </div>
          <SignIn
            routing="hash"
            appearance={appearance}
            fallbackRedirectUrl="/admin"
            signUpUrl={undefined}
          />
          <p className="text-xs text-gray-600">Admin access only. Unauthorised access is prohibited.</p>
        </div>
      </Show>
    </>
  );
}

function Router() {
  return (
    <>
      <ClerkTokenSync />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in" component={() => (
          <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
            <SignIn routing="path" path="/sign-in" appearance={appearance} fallbackRedirectUrl="/dashboard" />
          </div>
        )} />
        <Route path="/sign-up" component={() => (
          <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
            <SignUp routing="path" path="/sign-up" appearance={appearance} fallbackRedirectUrl="/onboarding" />
          </div>
        )} />
        <Route path="/admin-login" component={AdminLoginPage} />
        <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingPage} />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/staking" component={() => <ProtectedRoute component={StakingPlansPage} />} />
        <Route path="/transactions" component={() => <ProtectedRoute component={TransactionsPage} />} />
        <Route path="/referrals" component={() => <ProtectedRoute component={ReferralsPage} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
        <Route path="/admin" component={() => <AdminProtectedRoute component={AdminPage} />} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
