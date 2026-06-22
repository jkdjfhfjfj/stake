import { useState } from "react";
import { useLocation } from "wouter";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, User, MapPin, Smartphone, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Your Name", icon: User, desc: "How should we address you?" },
  { id: 2, title: "Location", icon: MapPin, desc: "Which county are you in?" },
  { id: 3, title: "M-Pesa Number", icon: Smartphone, desc: "Your mobile money number" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const completeOnboarding = useCompleteOnboarding({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        navigate("/dashboard");
      },
      onError: () => {
        toast({ title: "Something went wrong", variant: "destructive" });
      },
    },
  });

  const handleNext = () => {
    if (step === 1 && !fullName.trim()) return;
    if (step === 2 && !location.trim()) return;
    if (step === 3) {
      completeOnboarding.mutate({ data: { fullName, location, mpesaNumber } });
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome to StakeKE</h1>
          <p className="text-gray-400 text-sm">Let's set up your profile in 3 quick steps</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s.id <= step ? "bg-green-500" : "bg-green-900/40"
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-[#111a14] border border-green-900/40 rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-green-900/40 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{steps[0].title}</h2>
                  <p className="text-xs text-gray-400">{steps[0].desc}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Wanjiku"
                  className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-green-900/40 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{steps[1].title}</h2>
                  <p className="text-xs text-gray-400">{steps[1].desc}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="location" className="text-gray-300">County / City</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-green-900/40 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{steps[2].title}</h2>
                  <p className="text-xs text-gray-400">{steps[2].desc}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="mpesa" className="text-gray-300">M-Pesa Number</Label>
                <Input
                  id="mpesa"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for deposits and withdrawals</p>
              </div>
            </div>
          )}

          <Button
            className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white h-11"
            onClick={handleNext}
            disabled={completeOnboarding.isPending}
          >
            {step === 3 ? (
              completeOnboarding.isPending ? "Setting up..." : (
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Complete Setup</span>
              )
            ) : (
              <span className="flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Step {step} of 3
        </p>
      </div>
    </div>
  );
}
