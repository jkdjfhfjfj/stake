import { useEffect, useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, Save, Wifi, WifiOff, Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

function authedFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

export default function AdminSettings() {
  const { data, isLoading } = useGetAdminSettings();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [form, setForm] = useState({
    payheroUsername: "",
    payheroPassword: "",
    payheroChannelId: "",
    tier1ReferralPercent: 5,
    tier2ReferralPercent: 2,
  });

  useEffect(() => {
    if (data) {
      setForm({
        payheroUsername: data.payheroUsername ?? "",
        payheroPassword: data.payheroPassword ?? "",
        payheroChannelId: data.payheroChannelId ?? "",
        tier1ReferralPercent: data.tier1ReferralPercent ?? 5,
        tier2ReferralPercent: data.tier2ReferralPercent ?? 2,
      });
    }
  }, [data]);

  const update = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings saved!", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      },
      onError: (e: any) => {
        toast({ title: "Error saving", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const testPayhero = async () => {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await authedFetch("/api/admin/settings/test-payhero", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus("ok");
        setTestMsg(data.message ?? "Connection successful!");
        toast({ title: "PayHero connected!", description: data.message, variant: "success" });
      } else {
        setTestStatus("fail");
        setTestMsg(data.error ?? "Connection failed");
        toast({ title: "PayHero test failed", description: data.error ?? "Check your credentials", variant: "destructive" });
      }
    } catch (e: any) {
      setTestStatus("fail");
      setTestMsg(e.message ?? "Network error");
      toast({ title: "Connection error", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6 max-w-2xl">
      {/* PayHero */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-green-400" /> PayHero API Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400 bg-green-900/10 border border-green-900/20 rounded-lg p-3">
            Enter your PayHero credentials from <span className="text-green-400">backend.payhero.co.ke</span>.
            These are used for M-Pesa STK Push (deposits) and B2C (withdrawals).
          </p>
          <div>
            <Label className="text-gray-300">Username</Label>
            <Input value={form.payheroUsername} onChange={(e) => setForm(f => ({ ...f, payheroUsername: e.target.value }))}
              placeholder="PayHero username"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          <div>
            <Label className="text-gray-300">Password</Label>
            <div className="relative mt-1.5">
              <Input value={form.payheroPassword} onChange={(e) => setForm(f => ({ ...f, payheroPassword: e.target.value }))}
                type={showPass ? "text" : "password"} placeholder="PayHero password"
                className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 pr-10" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Channel ID (for M-Pesa)</Label>
            <Input value={form.payheroChannelId} onChange={(e) => setForm(f => ({ ...f, payheroChannelId: e.target.value }))}
              placeholder="e.g. 12345"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-green-900/40 text-green-400 hover:bg-green-900/20 gap-2"
              onClick={testPayhero}
              disabled={testStatus === "loading"}
            >
              {testStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : testStatus === "ok" ? (
                <Wifi className="w-4 h-4" />
              ) : testStatus === "fail" ? (
                <WifiOff className="w-4 h-4 text-red-400" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              Test Connection
            </Button>
            {testMsg && (
              <span className={`text-xs ${testStatus === "ok" ? "text-green-400" : "text-red-400"}`}>
                {testMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Settings */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader>
          <CardTitle className="text-base text-white">Referral Commission Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400">
            Commission rates applied when a referred user completes their first stake.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Tier 1 Rate (%)</Label>
              <Input value={form.tier1ReferralPercent} type="number" min={0} max={100}
                onChange={(e) => setForm(f => ({ ...f, tier1ReferralPercent: Number(e.target.value) }))}
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
              <p className="text-xs text-gray-500 mt-1">Direct referrals' first stake</p>
            </div>
            <div>
              <Label className="text-gray-300">Tier 2 Rate (%)</Label>
              <Input value={form.tier2ReferralPercent} type="number" min={0} max={100}
                onChange={(e) => setForm(f => ({ ...f, tier2ReferralPercent: Number(e.target.value) }))}
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
              <p className="text-xs text-gray-500 mt-1">Second-level referrals' first stake</p>
            </div>
          </div>
          <div className="p-3 bg-green-900/10 border border-green-900/20 rounded-lg text-xs text-gray-400">
            Example: A user stakes KES 10,000. Tier 1 referrer earns KES {(10000 * form.tier1ReferralPercent / 100).toLocaleString()},
            Tier 2 earns KES {(10000 * form.tier2ReferralPercent / 100).toLocaleString()}.
          </div>
        </CardContent>
      </Card>

      <Button className="bg-green-600 hover:bg-green-500 gap-2 w-full sm:w-auto"
        disabled={update.isPending}
        onClick={() => update.mutate({ data: form })}>
        <Save className="w-4 h-4" />
        {update.isPending ? "Saving…" : "Save All Settings"}
      </Button>
    </div>
  );
}
