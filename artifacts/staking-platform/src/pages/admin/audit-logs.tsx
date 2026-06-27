import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ShieldCheck, User, Settings, Lock, DollarSign, AlertTriangle } from "lucide-react";

const actionIcons: Record<string, any> = {
  BALANCE_ADJUSTMENT: DollarSign,
  ROLE_UPDATE: ShieldCheck,
  USER_LOCK: Lock,
  USER_UNLOCK: Lock,
  WITHDRAWAL_DISBURSE: DollarSign,
  WITHDRAWAL_REJECT: AlertTriangle,
  SETTINGS_UPDATE: Settings,
};

const actionColors: Record<string, string> = {
  BALANCE_ADJUSTMENT: "text-yellow-400 bg-yellow-900/20",
  ROLE_UPDATE: "text-purple-400 bg-purple-900/20",
  USER_LOCK: "text-red-400 bg-red-900/20",
  USER_UNLOCK: "text-green-400 bg-green-900/20",
  WITHDRAWAL_DISBURSE: "text-green-400 bg-green-900/20",
  WITHDRAWAL_REJECT: "text-red-400 bg-red-900/20",
  SETTINGS_UPDATE: "text-blue-400 bg-blue-900/20",
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-KE");
}

export default function AdminAuditLogs() {
  const { data: logs = [], isLoading } = useListAuditLogs();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-[#0d1a10] rounded-xl border border-green-900/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{logs.length} audit {logs.length === 1 ? "entry" : "entries"}</p>
      </div>

      {logs.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No audit logs yet</p>
            <p className="text-xs text-gray-500 mt-1">Admin actions will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const actionKey = log.action?.split(" ")[0] ?? "";
            const Icon = actionIcons[actionKey] ?? ShieldCheck;
            const colorClass = actionColors[actionKey] ?? "text-gray-400 bg-gray-900/20";
            return (
              <div key={log.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-3.5 flex items-start gap-3 hover:border-green-800/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{log.action}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.adminEmail}
                    </span>
                    {log.note && <span className="text-gray-500">• {log.note}</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{timeAgo(log.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
