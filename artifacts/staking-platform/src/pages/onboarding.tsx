import { useState } from "react";
import { useLocation } from "wouter";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, User, MapPin, Smartphone, ArrowRight, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Kisii",
  "Nyeri", "Meru", "Kakamega", "Kitale", "Malindi", "Garissa", "Machakos",
  "Naivasha", "Kericho", "Bungoma", "Embu", "Lamu", "Mandera",
];

const steps = [
  { id: 1, title: "Your Name", icon: User, desc: "How should we address you?" },
  { id: 2, title: "Location", icon: MapPin, desc: "Which county are you in?" },
  { id: 3, title: "M-Pesa Number", icon: Smartphone, desc: "Your mobile money number" },
  { id: 4, title: "Referral Code", icon: Gift, desc: "Have a referral code? (optional)" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const completeOnboarding = useCompleteOnboarding({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        navigate("/dashboard");
      },
      onError: (e: any) => {
        toast({ title: "Setup failed", description: e?.data?.error ?? "Please try again.", variant: "destructive" });
      },
    },
  });

  const filteredCounties = KENYAN_COUNTIES.filter((c) =>
    c.toLowerCase().includes(locationQuery.toLowerCase())
  );

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!fullName.trim()) return "Please enter your full name";
      if (fullName.trim().length < 2) return "Name must be at least 2 characters";
    }
    if (step === 2) {
      if (!location.trim()) return "Please select or enter your county";
    }
    if (step === 3) {
      if (!mpesaNumber.trim()) return "Please enter your M-Pesa number";
      const digits = mpesaNumber.replace(/\s+/g, "").replace(/^(\+254|254|0)/, "");
      if (digits.length !== 9) return "Enter a valid Safaricom number (e.g. 0712 345 678)";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    if (step === 4) {
      completeOnboarding.mutate({ data: { fullName: fullName.trim(), location: location.trim(), mpesaNumber: mpesaNumber.trim() } });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
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
          <p className="text-gray-400 text-sm">Set up your profile in {steps.length} quick steps</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                s.id < step ? "bg-green-500" : s.id === step ? "bg-green-400" : "bg-green-900/40"
              }`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="bg-[#111a14] border border-green-900/40 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-green-900/40 flex items-center justify-center shrink-0">
              {(() => { const Icon = steps[step - 1].icon; return <Icon className="w-5 h-5 text-green-400" />; })()}
            </div>
            <div>
              <h2 className="font-semibold text-white">{steps[step - 1].title}</h2>
              <p className="text-xs text-gray-400">{steps[step - 1].desc}</p>
            </div>
            <span className="ml-auto text-xs text-gray-600">{step}/{steps.length}</span>
          </div>

          {step === 1 && (
            <div>
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Jane Wanjiku"
                autoFocus
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
              />
            </div>
          )}

          {step === 2 && (
            <div className="relative">
              <Label htmlFor="location" className="text-gray-300">County / City</Label>
              <Input
                id="location"
                value={locationQuery || location}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Nairobi"
                autoFocus
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
              />
              {showSuggestions && filteredCounties.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-[#1a2820] border border-green-900/40 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredCounties.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-green-900/30 transition-colors"
                      onMouseDown={() => {
                        setLocation(c);
                        setLocationQuery(c);
                        setShowSuggestions(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <Label htmlFor="mpesa" className="text-gray-300">M-Pesa Number</Label>
              <Input
                id="mpesa"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 0712 345 678"
                type="tel"
                autoFocus
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">Safaricom number used for deposits and withdrawals</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <Label htmlFor="referral" className="text-gray-300">Referral Code <span className="text-gray-500">(optional)</span></Label>
              <Input
                id="referral"
                disabled
                placeholder="Enter code if you have one"
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1.5">Referral codes are entered at registration. You can skip this step.</p>
              <div className="mt-4 p-3 bg-green-900/10 border border-green-900/20 rounded-lg">
                <p className="text-xs text-green-400 font-medium mb-1">You're almost done! 🎉</p>
                <p className="text-xs text-gray-400">Review your details before completing setup:</p>
                <div className="mt-2 space-y-1 text-xs text-gray-300">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{fullName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{location}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">M-Pesa</span><span>{mpesaNumber}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                variant="outline"
                className="flex-1 border-green-900/40 text-gray-400 hover:text-white hover:bg-green-900/20"
                onClick={() => setStep((s) => s - 1)}
                disabled={completeOnboarding.isPending}
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1 bg-green-600 hover:bg-green-500 text-white h-11"
              onClick={handleNext}
              disabled={completeOnboarding.isPending}
            >
              {step === 4 ? (
                completeOnboarding.isPending ? "Setting up…" : (
                  <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Complete Setup</span>
                )
              ) : (
                <span className="flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">Step {step} of {steps.length}</p>
      </div>
    </div>
  );
}
