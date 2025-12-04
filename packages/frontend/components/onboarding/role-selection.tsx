"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { Home, Plane, UserCircle } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";

interface RoleSelectionProps {
  onRoleSelected: (role: UserRole) => void;
}

export function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);

  const roles = [
    {
      value: "traveler" as UserRole,
      icon: Plane,
      title: t("onboarding.traveler_title"),
      description: t("onboarding.traveler_desc"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "host" as UserRole,
      icon: Home,
      title: t("onboarding.host_title"),
      description: t("onboarding.host_desc"),
      color: "from-purple-500 to-pink-500",
    },
    {
      value: "both" as UserRole,
      icon: UserCircle,
      title: t("onboarding.both_title"),
      description: t("onboarding.both_desc"),
      color: "from-orange-500 to-red-500",
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold">{t("onboarding.choose_role")}</h2>
        <p className="text-muted-foreground">Select how you want to use NomadNodes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.value;

          return (
            <Card
              key={role.value}
              className={`group cursor-pointer transition-all hover:shadow-xl ${
                isSelected ? "ring-primary ring-2" : ""
              }`}
              onClick={() => setSelectedRole(role.value)}
            >
              <CardHeader>
                <div
                  className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${role.color} p-3`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant={isSelected ? "default" : "outline"}>
                  {isSelected ? "Selected" : "Select"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Button size="lg" disabled={!selectedRole} onClick={handleContinue}>
          {t("onboarding.continue")}
        </Button>
      </div>
    </div>
  );
}
