import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User, Mail, Phone, Shield, Save, KeyRound, Eye, EyeOff,
  CheckCircle, AlertCircle, TrendingUp, Wallet, Calendar, Copy,
  Camera, Upload, FileCheck, Clock, XCircle, Info, LogOut, Sun, Moon,
  Building2, Link2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import { useAppAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";

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

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function KycSection() {
  const { toast } = useToast();
  const [kyc, setKyc] = useState<{ kycStatus: string; kycDocumentUrl: string | null; kycRequestedAt: string | null } | null>(null);
  const [publicSettings, setPublicSettings] = useState<{ cloudinaryCloudName: string; cloudinaryUploadPreset: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authedFetch("/api/users/me/kyc").then(r => r.json()).then(setKyc).catch(() => {});
    fetch("/api/settings/public").then(r => r.json()).then(d => setPublicSettings(d)).catch(() => {});
  }, []);

  if (!kyc || kyc.kycStatus === "NONE") return null;

  const handleFileUpload = async (file: File) => {
    if (!publicSettings?.cloudinaryCloudName || !publicSettings?.cloudinaryUploadPreset) {
      toast({ title: "Upload not configured", description: "Contact support for KYC assistance", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", publicSettings.cloudinaryUploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${publicSettings.cloudinaryCloudName}/image/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUploadedUrl(data.secure_url);
      toast({ title: "Document uploaded!", description: "Click Submit to complete your KYC", variant: "success" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submitKyc = async () => {
    if (!uploadedUrl) return;
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/users/me/kyc", {
        method: "PATCH",
        body: JSON.stringify({ documentUrl: uploadedUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast({ title: "KYC submitted for review!", description: "We'll notify you once verified.", variant: "success" });
      setKyc(k => k ? { ...k, kycStatus: "SUBMITTED" } : k);
      setUploadedUrl("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; title: string; desc: string; color: string; bgColor: string }> = {
    REQUESTED: {
      icon: <Camera className="w-4 h-4 text-yellow-400" />,
      title: "Identity Verification Required",
      desc: "Please upload a clear photo of your National ID (front & back) or Passport.",
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/10 border-yellow-900/30",
    },
    SUBMITTED: {
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      title: "KYC Under Review",
      desc: "Your document has been submitted. We'll notify you once reviewed.",
      color: "text-blue-400",
      bgColor: "bg-blue-900/10 border-blue-900/30",
    },
    APPROVED: {
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      title: "Identity Verified ✓",
      desc: "Your account is fully verified.",
      color: "text-green-400",
      bgColor: "bg-green-900/10 border-green-900/30",
    },
    REJECTED: {
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      title: "KYC Rejected — Please Re-upload",
      desc: "Your document was rejected. Please upload a clearer photo.",
      color: "text-red-400",
      bgColor: "bg-red-900/10 border-red-900/30",
    },
  };

  const cfg = statusConfig[kyc.kycStatus];
  if (!cfg) return null;

  return (
    <Card className="bg-[#0d1a10] border-green-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-900/30 flex items-center justify-center">
            <FileCheck className="w-3.5 h-3.5 text-orange-400" />
          </div>
          KYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-xl p-3.5 border flex items-start gap-3 ${cfg.bgColor}`}>
          {cfg.icon}
          <div>
            <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
          </div>
        </div>

        {(kyc.kycStatus === "REQUESTED" || kyc.kycStatus === "REJECTED") && (
          <div className="space-y-3">
            <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 text-xs text-gray-400 space-y-1">
              <p className="flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0 text-gray-500" />Upload a clear, readable photo of your National ID or Passport</p>
              <p className="flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0 text-gray-500" />Supported formats: JPG, PNG (max 10MB)</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            />

            {uploadedUrl ? (
              <div className="space-y-2">
                <img src={uploadedUrl} alt="Uploaded document" className="w-full rounded-xl border border-green-900/30 object-contain max-h-48" />
                <p className="text-xs text-green-400 text-center">Document ready to submit</p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-500 h-9" onClick={submitKyc} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </Button>
                  <Button variant="outline" className="border-green-900/40 text-gray-400 h-9" onClick={() => { setUploadedUrl(""); if (fileRef.current) fileRef.current.value = ""; }}>
                    Re-upload
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed border-orange-800/40 text-orange-400 hover:bg-orange-900/10 h-12 gap-2"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Choose Document to Upload</>
                )}
              </Button>
            )}
          </div>
        )}

        {kyc.kycStatus === "SUBMITTED" && kyc.kycDocumentUrl && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Submitted document:</p>
            <img src={kyc.kycDocumentUrl} alt="Submitted document" className="w-full rounded-xl border border-blue-900/30 object-contain max-h-40" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data: me, isLoading } = useGetMe();
  const { toast } = useToast();
  const { user, logout } = useAppAuth();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({ fullName: "", mpesaNumber: "", bankName: "", bankAccountNumber: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setProfileForm({
        fullName: me.fullName ?? "",
        mpesaNumber: me.mpesaNumber ?? "",
        bankName: (me as any).bankName ?? "",
        bankAccountNumber: (me as any).bankAccountNumber ?? "",
      });
    }
  }, [me]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await authedFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: profileForm.fullName || undefined,
          mpesaNumber: profileForm.mpesaNumber || undefined,
          bankName: profileForm.bankName || null,
          bankAccountNumber: profileForm.bankAccountNumber || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast({ title: "Profile updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast({ title: "Password too short", description: "At least 8 characters required", variant: "destructive" });
      return;
    }
    setPwSaving(true);
    try {
      const res = await authedFetch("/api/users/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast({ title: "Password changed successfully!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPwSaving(false);
    }
  };

  const copyReferralCode = async () => {
    if (me?.referralCode) {
      await navigator.clipboard.writeText(me.referralCode).catch(() => {});
      toast({ title: "Referral code copied!" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const initials = me?.fullName
    ? me.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : me?.email?.[0]?.toUpperCase() ?? "U";

  const pwStrength = pwForm.newPassword.length >= 12 ? "Strong" : pwForm.newPassword.length >= 8 ? "Good" : pwForm.newPassword.length > 0 ? "Weak" : "";
  const pwStrengthColor = pwStrength === "Strong" ? "text-green-400" : pwStrength === "Good" ? "text-yellow-400" : "text-red-400";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account information and security</p>
        </div>

        {/* Profile Overview */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center text-white text-2xl font-black">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xl font-bold text-white">{me?.fullName ?? "User"}</p>
                  {me?.role === "ADMIN" && (
                    <Badge className="bg-amber-900/40 text-amber-400 border-amber-700/40 text-xs">Admin</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400">{me?.email}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-medium">{formatKES(me?.availableBalance ?? 0)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("en-KE") : "—"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-900/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-green-400" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs">Email Address</Label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 bg-[#0a0f0d] border border-green-900/20 rounded-xl px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  {me?.email}
                </div>
                <Badge className="bg-green-900/30 text-green-400 border-green-700/30 text-xs shrink-0">Verified</Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">M-Pesa Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={profileForm.mpesaNumber}
                  onChange={(e) => setProfileForm(p => ({ ...p, mpesaNumber: e.target.value }))}
                  placeholder="e.g. 0712345678"
                  className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for M-Pesa deposits and withdrawals</p>
            </div>
            <div className="border-t border-green-900/20 pt-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Bank Account (for withdrawals)</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-xs">Bank Name</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={profileForm.bankName}
                      onChange={(e) => setProfileForm(p => ({ ...p, bankName: e.target.value }))}
                      placeholder="e.g. KCB, Equity, Co-operative"
                      className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Bank Account Number</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={profileForm.bankAccountNumber}
                      onChange={(e) => setProfileForm(p => ({ ...p, bankAccountNumber: e.target.value }))}
                      placeholder="e.g. 1234567890"
                      className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-500 gap-2 w-full sm:w-auto"
              disabled={profileSaving}
              onClick={saveProfile}
            >
              <Save className="w-4 h-4" />
              {profileSaving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Referral Code & Link */}
        {me?.referralCode && (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                </div>
                Referral Code &amp; Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#0a0f0d] border border-green-900/30 rounded-xl px-4 py-2.5 font-mono text-lg font-bold text-green-400 tracking-widest">
                  {me.referralCode}
                </div>
                <Button variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-2 shrink-0" onClick={copyReferralCode}>
                  <Copy className="w-4 h-4" /> Copy Code
                </Button>
              </div>
              <div>
                <Label className="text-gray-400 text-xs mb-1.5 block">Your Referral Link</Label>
                <div className="bg-[#0a0f0d] border border-green-900/20 rounded-xl px-3 py-2 text-xs text-green-400/80 font-mono overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <span className="truncate flex-1 min-w-0">{`${window.location.origin}/register?ref=${me.referralCode}`}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full border-green-700/50 text-green-300 hover:bg-green-900/30 gap-1.5 h-9"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${me.referralCode}`).catch(() => {});
                    toast({ title: "Referral link copied!" });
                  }}>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </Button>
              </div>
              <p className="text-xs text-gray-500">Share your link or code to earn referral rewards when friends join and stake.</p>
            </CardContent>
          </Card>
        )}

        {/* Appearance */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-900/30 flex items-center justify-center">
                {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
              </div>
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Switch between dark and light theme</p>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
                <Sun className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Verification */}
        <KycSection />

        {/* Change Password */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              </div>
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNew ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 pr-10"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwStrength && (
                <p className={`text-xs mt-1 ${pwStrengthColor}`}>Strength: {pwStrength}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500"
                />
                {pwForm.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pwForm.newPassword === pwForm.confirmPassword
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>
            </div>
            <Button
              className="bg-blue-700 hover:bg-blue-600 gap-2 w-full sm:w-auto"
              disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword || pwSaving}
              onClick={changePassword}
            >
              <Shield className="w-4 h-4" />
              {pwSaving ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out — bottom */}
        <Card className="bg-[#0d1a10] border-red-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-900/30 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-red-400" />
              </div>
              Sign Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-4">You will be returned to the login screen. Your session data will be cleared.</p>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-red-900/40 text-red-400 hover:bg-red-900/15 hover:text-red-300 gap-2"
              onClick={() => { logout(); queryClient.clear(); navigate("/login"); }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out of StakeKE
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
