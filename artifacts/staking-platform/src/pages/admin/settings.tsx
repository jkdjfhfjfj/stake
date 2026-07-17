import { useEffect, useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings, Eye, EyeOff, Save, Wifi, WifiOff, Loader2, PlayCircle,
  CreditCard, GitBranch, Info, MessageCircle, Camera, CheckCircle, Bot,
} from "lucide-react";
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

  const [extForm, setExtForm] = useState({
    whatsappNumber: "",
    cloudinaryCloudName: "",
    cloudinaryUploadPreset: "",
  });
  const [extLoading, setExtLoading] = useState(false);
  const [extSaving, setExtSaving] = useState(false);

  // Groq AI key state (separate save so we don't accidentally clear it)
  const [groqApiKey, setGroqApiKey] = useState("");
  const [groqKeySet, setGroqKeySet] = useState(false);
  const [groqKeyMasked, setGroqKeyMasked] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqSaving, setGroqSaving] = useState(false);

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

  useEffect(() => {
    setExtLoading(true);
    authedFetch("/api/admin/settings/extended")
      .then((r) => r.json())
      .then((d) => {
        setExtForm({
          whatsappNumber: d.whatsappNumber ?? "",
          cloudinaryCloudName: d.cloudinaryCloudName ?? "",
          cloudinaryUploadPreset: d.cloudinaryUploadPreset ?? "",
        });
        setGroqKeySet(Boolean(d.groqApiKeySet));
        setGroqKeyMasked(d.groqApiKeyMasked ?? "");
      })
      .catch(() => {})
      .finally(() => setExtLoading(false));
  }, []);

  const update = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "PayHero & Referral settings saved!", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      },
      onError: (e: any) => {
        toast({ title: "Error saving", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const saveExtended = async () => {
    setExtSaving(true);
    try {
      const res = await authedFetch("/api/admin/settings/extended", {
        method: "PATCH",
        body: JSON.stringify(extForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Communication & KYC settings saved!", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setExtSaving(false);
    }
  };

  const saveGroqKey = async () => {
    if (!groqApiKey.trim()) return;
    setGroqSaving(true);
    try {
      const res = await authedFetch("/api/admin/settings/extended", {
        method: "PATCH",
        body: JSON.stringify({ groqApiKey: groqApiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Groq API key saved!", description: "The AI widget is now active for all users.", variant: "success" });
      setGroqApiKey("");
      setGroqKeySet(true);
      // Refresh masked key
      authedFetch("/api/admin/settings/extended").then(r => r.json()).then(d => {
        setGroqKeyMasked(d.groqApiKeyMasked ?? "");
        setGroqKeySet(Boolean(d.groqApiKeySet));
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGroqSaving(false);
    }
  };

  const testPayhero = async () => {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await authedFetch("/api/admin/settings/test-payhero", { method: "POST" });
      const d = await res.json();
      if (res.ok && d.ok) {
        setTestStatus("ok");
        setTestMsg(d.message ?? "Connection successful!");
        toast({ title: "PayHero connected!", description: d.message, variant: "success" });
      } else {
        setTestStatus("fail");
        setTestMsg(d.error ?? "Connection failed");
        toast({ title: "PayHero test failed", description: d.error ?? "Check credentials", variant: "destructive" });
      }
    } catch (e: any) {
      setTestStatus("fail");
      setTestMsg(e.message ?? "Network error");
    }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: key.includes("Percent") ? Number(e.target.value) : e.target.value }));

  const ef = (key: keyof typeof extForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setExtForm(prev => ({ ...prev, [key]: e.target.value }));

  if (isLoading || extLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-[#0d1a10] rounded-xl border border-green-900/20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* PayHero */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            </div>
            PayHero API Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/10 border border-blue-900/20 rounded-xl p-3 text-xs text-blue-300/80 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Enter your PayHero credentials from <strong>backend.payhero.co.ke</strong>. Used for M-Pesa STK Push and B2C disbursement.</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Username</Label>
              <Input value={form.payheroUsername} onChange={f("payheroUsername")} placeholder="PayHero username"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Channel ID (M-Pesa)</Label>
              <Input value={form.payheroChannelId} onChange={f("payheroChannelId")} placeholder="e.g. 12345"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Password</Label>
              <div className="relative mt-1">
                <Input value={form.payheroPassword} onChange={f("payheroPassword")}
                  type={showPass ? "text" : "password"} placeholder="PayHero password"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 pr-10 h-9" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button type="button" variant="outline" size="sm"
              className="border-green-900/40 text-green-400 hover:bg-green-900/20 gap-2"
              onClick={testPayhero} disabled={testStatus === "loading"}>
              {testStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" />
                : testStatus === "ok" ? <Wifi className="w-4 h-4 text-green-400" />
                : testStatus === "fail" ? <WifiOff className="w-4 h-4 text-red-400" />
                : <PlayCircle className="w-4 h-4" />}
              Test Connection
            </Button>
            {testMsg && (
              <span className={`text-xs ${testStatus === "ok" ? "text-green-400" : "text-red-400"}`}>{testMsg}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Rates */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            </div>
            Referral Commission Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400">Commission percentages applied when a referred user makes their first stake.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 text-xs">Tier 1 Rate (%)</Label>
              <Input value={form.tier1ReferralPercent} type="number" min={0} max={100}
                onChange={f("tier1ReferralPercent")}
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
              <p className="text-[10px] text-gray-500 mt-1">Direct referrals</p>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Tier 2 Rate (%)</Label>
              <Input value={form.tier2ReferralPercent} type="number" min={0} max={100}
                onChange={f("tier2ReferralPercent")}
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
              <p className="text-[10px] text-gray-500 mt-1">Second-level referrals</p>
            </div>
          </div>
          <div className="bg-purple-900/10 border border-purple-900/20 rounded-xl p-3 text-xs text-gray-400">
            <p className="font-medium text-purple-300 mb-2">Example: User stakes KES 10,000</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tier 1 earns:</span>
                <span className="text-purple-400 font-medium">KES {(10000 * form.tier1ReferralPercent / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tier 2 earns:</span>
                <span className="text-blue-400 font-medium">KES {(10000 * form.tier2ReferralPercent / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-green-600 hover:bg-green-500 gap-2 w-full sm:w-auto h-10"
        disabled={update.isPending}
        onClick={() => update.mutate({ data: form })}>
        <Save className="w-4 h-4" />
        {update.isPending ? "Saving…" : "Save PayHero & Referral Settings"}
      </Button>

      {/* WhatsApp Support */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/30 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-green-400" />
            </div>
            WhatsApp Support Widget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-900/10 border border-green-900/20 rounded-xl p-3 text-xs text-green-300/80 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>A floating WhatsApp button will appear on all user pages. Include the country code (e.g. <strong>254712345678</strong> for Kenya).</span>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">WhatsApp Phone Number</Label>
            <Input value={extForm.whatsappNumber} onChange={ef("whatsappNumber")}
              placeholder="254712345678"
              className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            <p className="text-[10px] text-gray-500 mt-1">Leave blank to hide the widget</p>
          </div>
        </CardContent>
      </Card>

      {/* Cloudinary KYC */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-900/30 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-orange-400" />
            </div>
            KYC Document Upload (Cloudinary)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-900/10 border border-orange-900/20 rounded-xl p-3 text-xs text-orange-300/80 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Configure your Cloudinary account for KYC document uploads. Create an <strong>unsigned upload preset</strong> in your Cloudinary console. Only the cloud name and upload preset are shared with users — your API secret stays private.</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Cloud Name</Label>
              <Input value={extForm.cloudinaryCloudName} onChange={ef("cloudinaryCloudName")}
                placeholder="e.g. mycloud"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Upload Preset (unsigned)</Label>
              <Input value={extForm.cloudinaryUploadPreset} onChange={ef("cloudinaryUploadPreset")}
                placeholder="e.g. kyc_docs"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
          </div>
          <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 text-xs text-gray-400 space-y-1">
            <p className="text-gray-300 font-medium">How KYC works:</p>
            <p>1. Admin requests KYC from a user in the Users tab</p>
            <p>2. User receives a notification and sees a KYC prompt in their profile</p>
            <p>3. User uploads their ID/Passport directly to Cloudinary</p>
            <p>4. Admin reviews the document and approves or rejects</p>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-green-600 hover:bg-green-500 gap-2 w-full sm:w-auto h-10"
        disabled={extSaving}
        onClick={saveExtended}>
        <Save className="w-4 h-4" />
        {extSaving ? "Saving…" : "Save Communication & KYC Settings"}
      </Button>

      {/* Qrok AI Assistant */}
      <Card className="bg-[#0d1a10] border-indigo-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-900/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            Qrok AI Assistant
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
              groqKeySet ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"
            }`}>
              {groqKeySet ? "Active" : "Not Configured"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-indigo-900/10 border border-indigo-900/25 rounded-xl p-3 text-xs text-indigo-300/80 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Enter your <strong>Groq API key</strong> to enable the AI chat widget for all users.
              Get a free key at <strong>console.groq.com</strong>. The key is stored securely in the database.
            </span>
          </div>

          {/* Current key status */}
          {groqKeySet && groqKeyMasked && (
            <div className="flex items-center gap-2 bg-green-900/10 border border-green-800/25 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-400 font-medium">API key configured</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{groqKeyMasked}</p>
              </div>
            </div>
          )}

          {/* Key input */}
          <div>
            <Label className="text-gray-300 text-xs">
              {groqKeySet ? "Replace API Key" : "Groq API Key"} <span className="text-gray-500">(starts with gsk_)</span>
            </Label>
            <div className="relative mt-1.5">
              <Input
                value={groqApiKey}
                onChange={e => setGroqApiKey(e.target.value)}
                type={showGroqKey ? "text" : "password"}
                placeholder={groqKeySet ? "Paste new key to replace existing…" : "gsk_…"}
                className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-indigo-500 pr-10 h-9 font-mono text-xs"
              />
              <button type="button" onClick={() => setShowGroqKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 gap-2 h-9"
              disabled={groqSaving || !groqApiKey.trim()}
              onClick={saveGroqKey}>
              {groqSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {groqSaving ? "Saving…" : groqKeySet ? "Replace Key" : "Save Key & Enable AI"}
            </Button>
            {!groqKeySet && (
              <p className="text-xs text-gray-500">Widget will appear once a key is saved</p>
            )}
          </div>

          <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 text-xs text-gray-500 space-y-1">
            <p className="text-gray-400 font-medium">Model:</p>
            <p>Default: <code className="text-green-400 bg-green-900/20 px-1 rounded">llama3-8b-8192</code> — override with <code className="text-green-400 bg-green-900/20 px-1 rounded">QROK_MODEL</code> env var</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
