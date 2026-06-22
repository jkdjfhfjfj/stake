import { Link, useLocation } from "wouter";
import { useUser, SignOutButton } from "@clerk/react";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, Users,
  Bell, Settings, LogOut, TrendingUpIcon, ShieldCheck, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useListNotifications } from "@workspace/api-client-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staking", icon: TrendingUp, label: "Staking Plans" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/referrals", icon: Users, label: "Referrals" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: notifications } = useListNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1a10] border-r border-green-900/30 flex flex-col transition-transform",
        "md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 border-b border-green-900/20">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUpIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-green-400">StakeKE</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                location === item.href
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-green-900/30"
              )}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-green-900/20 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400">
            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center text-xs text-green-300">
              {user?.firstName?.[0] ?? "U"}
            </div>
            <span className="truncate text-white text-xs">{user?.emailAddresses[0]?.emailAddress}</span>
          </div>
          <SignOutButton>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d1a10] border-b border-green-900/20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <TrendingUpIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-green-400">StakeKE</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="text-gray-400 hover:text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-auto">
        <div className="pt-14 md:pt-0 p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
