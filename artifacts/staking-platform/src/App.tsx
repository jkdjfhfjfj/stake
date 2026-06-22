import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ClerkProvider, SignIn, SignUp, Show } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import StakingPlansPage from "@/pages/staking-plans";
import TransactionsPage from "@/pages/transactions";
import ReferralsPage from "@/pages/referrals";
import NotificationsPage from "@/pages/notifications";
import AdminPage from "@/pages/admin/index";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
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

function Router() {
  return (
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
      <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/staking" component={() => <ProtectedRoute component={StakingPlansPage} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={TransactionsPage} />} />
      <Route path="/referrals" component={() => <ProtectedRoute component={ReferralsPage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route component={NotFound} />
    </Switch>
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
