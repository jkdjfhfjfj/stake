import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, BarChart3, ArrowUpRight, Settings, FileText, GitBranch } from "lucide-react";
import AdminAnalytics from "./analytics";
import AdminUsers from "./users";
import AdminWithdrawals from "./withdrawals";
import AdminSettings from "./settings";
import AdminAuditLogs from "./audit-logs";
import AdminReferrals from "./referrals";

export default function AdminPage() {
  const { data: me } = useGetMe();

  if (!me) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (me.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Shield className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-900/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management and analytics</p>
          </div>
        </div>

        <Tabs defaultValue="analytics">
          <TabsList className="bg-[#0d1a10] border border-green-900/30 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Withdrawals
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <GitBranch className="w-4 h-4" /> Referrals
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <FileText className="w-4 h-4" /> Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="withdrawals"><AdminWithdrawals /></TabsContent>
          <TabsContent value="referrals"><AdminReferrals /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
          <TabsContent value="audit"><AdminAuditLogs /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
