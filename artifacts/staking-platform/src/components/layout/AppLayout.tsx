import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, Users,
  Bell, TrendingUpIcon, Settings, Shield, Zap, ChevronRight, MessageCircle,
  Bot, X, Send, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, useGetMe } from "@workspace/api-client-react";
import { useAppAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { useLocation as useWouterLocation } from "wouter";
import { getToken } from "@/lib/auth";

const navItems = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staking",       icon: TrendingUp,       label: "Staking" },
  { href: "/transactions",  icon: ArrowLeftRight,   label: "Transactions" },
  { href: "/referrals",     icon: Users,            label: "Referrals" },
  { href: "/notifications", icon: Bell,             label: "Notifications" },
  { href: "/profile",       icon: Settings,         label: "Profile" },
];

const bottomTabs = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home" },
  { href: "/staking",      icon: TrendingUp,      label: "Stake" },
  { href: "/transactions", icon: ArrowLeftRight,  label: "History" },
  { href: "/referrals",    icon: Users,           label: "Refer" },
  { href: "/profile",      icon: Settings,        label: "Profile" },
];

type ChatMsg = { role: "user" | "assistant"; content: string };

function QrokAIWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Check if AI is enabled (API key configured)
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => setEnabled(Boolean(d.qrokEnabled)))
      .catch(() => setEnabled(false));
  }, []);

  // Always render the button; show a "not configured" notice if AI is disabled

  useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMsgs: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Always show the button — if not configured, chat window shows a friendly notice

  return (
    <>
      {/* Floating button — sits to the left of the WhatsApp button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 md:bottom-6 right-[4.5rem] md:right-[4.5rem] z-50 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 active:opacity-70"
        title="Chat with Qrok AI"
        aria-label="Qrok AI Assistant"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-16 z-50 w-[min(340px,calc(100vw-2rem))] bg-[#0d1a10] border border-green-900/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 420 }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-900/60 to-purple-900/50 border-b border-green-900/30">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Qrok AI</p>
              <p className="text-[10px] text-gray-400">StakeKE Assistant · Always on</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-4">
                <Bot className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                {enabled === false ? (
                  <>
                    <p className="text-sm text-gray-300 font-medium">Qrok AI</p>
                    <p className="text-xs text-gray-500 mt-2 px-2">AI assistant is not configured yet. Ask your admin to add a Groq API key in Settings.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 font-medium">Hi! I'm Qrok AI 👋</p>
                    <p className="text-xs text-gray-500 mt-1">Ask me anything about StakeKE — deposits, staking plans, withdrawals, and more.</p>
                    <div className="mt-3 space-y-1.5">
                      {["How do I deposit via M-Pesa?", "What are the staking plans?", "How long does withdrawal take?"].map(q => (
                        <button key={q} onClick={() => { setInput(q); }}
                          className="w-full text-left text-xs bg-indigo-900/20 border border-indigo-800/30 text-indigo-300 rounded-lg px-3 py-2 hover:bg-indigo-900/30">
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-green-700/60 text-white rounded-br-none"
                    : "bg-[#1a2b1a] text-gray-200 rounded-bl-none border border-green-900/20"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a2b1a] border border-green-900/20 rounded-2xl rounded-bl-none px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-green-900/30 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything…"
              className="flex-1 bg-[#0a0f0d] border border-green-900/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 min-w-0"
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-indigo-500">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppWidget() {
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => { if (d.whatsappNumber) setPhone(d.whatsappNumber); })
      .catch(() => {});
  }, []);

  if (!phone) return null;

  const msg = encodeURIComponent("Hi, I need help with my StakeKE account.");
  const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ebe5d] active:opacity-70"
      title="Chat with support on WhatsApp"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="w-6 h-6 text-white fill-white" />
    </a>
  );
}

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
    <div className="bg-[#060d08] min-h-screen">

      {/* ══ DESKTOP SIDEBAR (md+) — always rendered, no transform ══ */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-[#080f0a] border-r border-green-900/25">
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

        {me && (
          <div className="mx-3 mt-4 p-3.5 rounded-2xl bg-[#0d2010] border border-green-800/30 shrink-0">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Available Balance</p>
            <p className="text-xl font-black text-green-400 leading-tight">
              KES {(me.availableBalance ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

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

      {/* ══ MOBILE BOTTOM TAB BAR ══ */}
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
                {isActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-green-400" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ══ WHATSAPP FLOAT WIDGET ══ */}
      <QrokAIWidget />
      <WhatsAppWidget />

      {/* ══ MAIN CONTENT ══ */}
      {/* isolate creates a new stacking context, preventing child z-indexes from
          interacting with fixed bars — eliminates Chrome GPU layer compositing overload */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 isolate">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
