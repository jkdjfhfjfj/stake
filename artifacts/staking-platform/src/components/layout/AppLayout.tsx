import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, Users,
  Bell, LogOut, TrendingUpIcon, Menu, X, Shield, Settings,
  ChevronRight, Zap
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useListNotifications, useGetMe } from "@workspace/api-client-react";
import { useAppAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { useLocation as useWouterLocation } from "wouter";

const navItems = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staking",       icon: TrendingUp,       label: "Staking Plans" },
  { href: "/transactions",  icon: ArrowLeftRight,   label: "Transactions" },
  { href: "/referrals",     icon: Users,            label: "Referrals" },
  { href: "/notifications", icon: Bell,             label: "Notifications" },
  { href: "/profile",       icon: Settings,         label: "Profile & Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useWouterLocation();
  const { user, logout } = useAppAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: notifications } = useListNotifications();
  const { data: me } = useGetMe();
  const unreadCount = notifications?.filter((n: { isRead: boolean }) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate("/login");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="bg-[#060d08] min-h-screen">
      {/* ── Fixed Sidebar (desktop) ──────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
        "bg-[#080f0a] border-r border-green-900/25",
        "transition-transform duration-200 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center border-b border-green-900/20 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/50 group-hover:bg-green-500 transition-colors">
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
          <div className="mx-3 mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-green-900/40 to-green-950/20 border border-green-800/30 shrink-0">
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
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group",
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-900/40"
                    : "text-gray-400 hover:text-white hover:bg-green-900/20"
                )}>
                  <item.icon className={cn("w-4 h-4 shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className={cn(
                      "text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold leading-none",
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
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group",
                  location.startsWith("/admin")
                    ? "bg-amber-600/80 text-white shadow-md shadow-amber-900/30"
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
          <Link href="/profile" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-900/10 hover:bg-green-900/20 transition-colors cursor-pointer mb-1">
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/15 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#080f0a] border-b border-green-900/20 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <TrendingUpIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-white">Stake<span className="text-green-400">KE</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9" : unreadCount}
                </span>
              )}
            </div>
          </Link>
          <button onClick={() => setMobileOpen((v) => !v)} className="text-gray-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      {/* md:ml-64 pushes past sidebar; pt-14 clears mobile top bar */}
      <main className="md:ml-64 pt-14 md:pt-0">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
