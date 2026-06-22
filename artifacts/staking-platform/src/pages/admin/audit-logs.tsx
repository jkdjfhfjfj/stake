import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ShieldCheck } from "lucide-react";

export default function AdminAuditLogs() {
  const { data: logs = [], isLoading } = useListAuditLogs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-400">{logs.length} audit entries</p>
      {logs.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No audit logs yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{log.action}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">by {log.adminEmail}</span>
                  {log.note && <span className="text-xs text-gray-500">• {log.note}</span>}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{new Date(log.createdAt).toLocaleString("en-KE")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
