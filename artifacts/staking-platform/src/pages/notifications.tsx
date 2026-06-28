import AppLayout from "@/components/layout/AppLayout";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, TrendingUp, Users, ShieldAlert, X } from "lucide-react";

const typeIcons: Record<string, any> = {
  DEPOSIT:              ArrowDownLeft,
  WITHDRAWAL_APPROVED:  ArrowUpRight,
  WITHDRAWAL_REJECTED:  ArrowUpRight,
  STAKE_MATURED:        TrendingUp,
  REFERRAL_EARNED:      Users,
  ADMIN_MESSAGE:        ShieldAlert,
};

const typeColors: Record<string, string> = {
  DEPOSIT:              "text-green-400 bg-green-900/30",
  WITHDRAWAL_APPROVED:  "text-blue-400 bg-blue-900/20",
  WITHDRAWAL_REJECTED:  "text-red-400 bg-red-900/20",
  STAKE_MATURED:        "text-yellow-400 bg-yellow-900/20",
  REFERRAL_EARNED:      "text-purple-400 bg-purple-900/20",
  ADMIN_MESSAGE:        "text-orange-400 bg-orange-900/20",
};

const typeLabels: Record<string, string> = {
  DEPOSIT:              "Deposit",
  WITHDRAWAL_APPROVED:  "Withdrawal",
  WITHDRAWAL_REJECTED:  "Withdrawal",
  STAKE_MATURED:        "Stake Matured",
  REFERRAL_EARNED:      "Referral",
  ADMIN_MESSAGE:        "Admin",
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE");
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead({ mutation: {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  }});
  const markAll = useMarkAllNotificationsRead({ mutation: {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  }});

  const unread = notifications.filter((n: any) => !n.isRead);
  const read = notifications.filter((n: any) => n.isRead);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {unread.length > 0 ? `${unread.length} unread` : "All caught up!"}
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-2"
              onClick={() => markAll.mutate()}>
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#0d1a10] rounded-xl border border-green-900/20" />)}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-14 text-center">
              <div className="w-14 h-14 rounded-full bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No notifications yet</p>
              <p className="text-gray-500 text-sm mt-1">We'll notify you of deposits, withdrawals, and stake updates</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Unread */}
            {unread.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">New</p>
                <div className="space-y-2">
                  {unread.map((n: any) => {
                    const Icon = typeIcons[n.type] ?? Bell;
                    const colorClass = typeColors[n.type] ?? "text-gray-400 bg-gray-900/20";
                    const label = typeLabels[n.type] ?? n.type;
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-4 rounded-xl border bg-green-900/10 border-green-700/30 cursor-pointer hover:bg-green-900/15 transition-colors"
                        onClick={() => markRead.mutate({ id: n.id })}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{n.title}</p>
                              <p className="text-xs text-gray-300 mt-0.5">{n.message}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className={`text-[10px] border-0 px-1.5 ${colorClass}`}>{label}</Badge>
                            <span className="text-[10px] text-gray-500">{timeAgo(n.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Read */}
            {read.length > 0 && (
              <div>
                {unread.length > 0 && (
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Earlier</p>
                )}
                <div className="space-y-1.5">
                  {read.map((n: any) => {
                    const Icon = typeIcons[n.type] ?? Bell;
                    const colorClass = typeColors[n.type] ?? "text-gray-400 bg-gray-900/20";
                    const label = typeLabels[n.type] ?? n.type;
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-3.5 rounded-xl border bg-[#0d1a10] border-green-900/20 opacity-70 hover:opacity-90 transition-opacity"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 opacity-60 ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-300">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] border-0 px-1.5 opacity-60 ${colorClass}`}>{label}</Badge>
                            <span className="text-[10px] text-gray-600">{timeAgo(n.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
