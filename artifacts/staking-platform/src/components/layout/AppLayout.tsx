import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, Users,
  Bell, LogOut, TrendingUpIcon, Settings, Shield, Zap, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, useGetMe } from "@workspace/api-client-react";
import { useAppAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { useLocation as useWouterLocation } from "wouter";

const navItems = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staking",       icon: TrendingUp,       label: "Staking" },
  { href: "/transactions",  icon: ArrowLeftRight,   label: "Transactions" },
  { href: "/referrals",     icon: Users,            label: "Referrals" },
  { href: "/notifications", icon: Bell,             label: "Notifications" },
  { href: "/profile",       icon: Settings,         label: "Profile" },
];

/* Bottom tab items for mobile (5 key pages) */
const bottomTabs = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home" },
  { href: "/staking",      icon: TrendingUp,      label: "Stake" },
  { href: "/transactions", icon: ArrowLeftRight,  label: "History" },
  { href: "/referrals",    icon: Users,           label: "Refer" },
  { href: "/profile",      icon: Settings,        label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location]  = useLocation();
  const [, navigate] = useWouterLocation();
  const { user, logout } = useAppAuth();
  const { data: notifications } = useListNotifications();
  const { data: me }             = useGetMe();
  const unreadCount = (notifications ?? []).filter((n: { isRead: boolean }) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate("/login");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    /*
     * GPU NOTE: No CSS transitions on position:fixed elements.
     * Desktop sidebar is always visible (no transform toggle).
     * Mobile uses a bottom tab bar — no sidebar, no overlay, no transform animation.
     * This eliminates Android Chrome GPU compositing glitches.
     */
    <div className="bg-[#060d08] min-h-screen">

      {/* ══ DESKTOP SIDEBAR (md+) — always rendered, no transform ══ */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-[#080f0a] border-r border-green-900/25">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center border-b border-green-900/20 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-950/60">
              <TrendingUpIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white leading-none tracking-tight">
                Stake<span className="text-green-400">KE</span>
              </span>
              <div className="text-[10px] text-green-600 leading-none mt-0.5">Investment Platform</div>
            </div>
          </Link>
        </div>

        {/* Balance pill */}
        {me && (
          <div className="mx-3 mt-4 p-3.5 rounded-2xl bg-[#0d2010] border border-green-800/30 shrink-0">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Available Balance</p>
            <p className="text-xl font-black text-green-400 leading-tight">
              KES {(me.availableBalance ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location === item.href ||
              (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer",
                  isActive
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-green-900/20"
                )}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className={cn(
                      "text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-green-500 text-white"
                    )}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                </div>
              </Link>
            );
          })}

          {/* Admin link */}
          {me?.role === "ADMIN" && (
            <>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mt-5 mb-2">Administration</p>
              <Link href="/admin">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer",
                  location.startsWith("/admin")
                    ? "bg-amber-600/80 text-white shadow-sm"
                    : "text-amber-400/60 hover:text-amber-300 hover:bg-amber-900/15"
                )}>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Admin Panel</span>
                  <Zap className="w-3 h-3 opacity-50" />
                </div>
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-green-900/20 shrink-0">
          <Link href="/profile">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-900/10 hover:bg-green-900/20 cursor-pointer mb-1">
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName ?? "User"}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/15 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ══ MOBILE TOP BAR ══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#080f0a] border-b border-green-900/20 px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <TrendingUpIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-white">Stake<span className="text-green-400">KE</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <div className="relative p-1">
              <Bell className="w-5 h-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9" : unreadCount}
                </span>
              )}
            </div>
          </Link>
          {me?.role === "ADMIN" && (
            <Link href="/admin">
              <div className="w-7 h-7 rounded-lg bg-amber-900/40 border border-amber-800/40 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ══ MOBILE BOTTOM TAB BAR ══
          Pure display — no transforms, no transitions, no GPU compositing.
          Solid background, standard position:fixed at bottom. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#080f0a] border-t border-green-900/25 flex items-stretch">
        {bottomTabs.map((tab) => {
          const isActive = location === tab.href ||
            (tab.href !== "/dashboard" && location.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center h-full gap-1 cursor-pointer",
                isActive ? "text-green-400" : "text-gray-600"
              )}>
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold leading-none">{tab.label}</span>
                {/* Active indicator dot — no animation */}
                {isActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-green-400" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ══ MAIN CONTENT ══
          md:ml-64 clears desktop sidebar.
          pt-14 clears mobile top bar.
          pb-20 clears mobile bottom tab bar. */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
