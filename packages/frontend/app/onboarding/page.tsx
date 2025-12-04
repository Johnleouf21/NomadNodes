"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RoleSelection } from "@/components/onboarding/role-selection";
import { MintSBT } from "@/components/onboarding/mint-sbt";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUserStore, type UserRole } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAuth();
  const { setRole } = useUserStore();
  const [step, setStep] = React.useState<"role" | "mint">("role");
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);

  // Redirect if not connected
  React.useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push("/");
    }
  }, [isConnected, isConnecting, router]);

  const handleRoleSelected = (role: UserRole) => {
    setSelectedRole(role);
    setRole(role);
    setStep("mint");
  };

  const handleMintComplete = () => {
    // Redirect based on role
    if (selectedRole === "host" || selectedRole === "both") {
      router.push("/dashboard/host");
    } else {
      router.push("/dashboard/traveler");
    }
  };

  if (isConnecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container min-h-screen px-4 py-16">
      {step === "role" && <RoleSelection onRoleSelected={handleRoleSelected} />}
      {step === "mint" && selectedRole && (
        <MintSBT role={selectedRole} onComplete={handleMintComplete} />
      )}
    </div>
  );
}
