import AppLayout from "@/components/layout/AppLayout";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, TrendingUp, Users, ShieldAlert } from "lucide-react";

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
  WITHDRAWAL_APPROVED:  "text-blue-400 bg-blue-900/30",
  WITHDRAWAL_REJECTED:  "text-red-400 bg-red-900/30",
  STAKE_MATURED:        "text-yellow-400 bg-yellow-900/30",
  REFERRAL_EARNED:      "text-purple-400 bg-purple-900/30",
  ADMIN_MESSAGE:        "text-orange-400 bg-orange-900/30",
};

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead({ mutation: {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  }});
  const markAll = useMarkAllNotificationsRead({ mutation: {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  }});

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-400 text-sm mt-1">{unread.length} unread</p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" className="border-green-700 text-green-300 hover:bg-green-900/30 gap-2"
              onClick={() => markAll.mutate()}>
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-12 text-center">
              <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell;
              const colorClass = typeColors[n.type] ?? "text-gray-400 bg-gray-900/30";
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    n.isRead ? "bg-[#0d1a10] border-green-900/20" : "bg-green-900/10 border-green-700/30"
                  }`}
                  onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString("en-KE")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
