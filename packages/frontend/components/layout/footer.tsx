"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, X } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Separator } from "@/components/ui/separator";
import { AdminSecretAccess } from "@/components/easter-eggs/admin-secret-access";

export function Footer() {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t("footer.platform"),
      links: [
        { label: t("nav.explore"), href: "/explore" },
        { label: t("footer.how_it_works"), href: "/#how-it-works" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.get_started"),
      links: [
        { label: t("footer.become_traveler"), href: "/onboarding" },
        { label: t("footer.become_host"), href: "/onboarding" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.privacy"), href: "/privacy" },
      ],
    },
  ];

  const socialLinks = [
    { icon: X, href: "https://x.com/nomad_nodes", label: "X (Twitter)" },
    { icon: Mail, href: "mailto:contact@nomadnodes.com", label: "Email" },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="md:col-span-2 lg:col-span-2">
            <AdminSecretAccess>
              <Link href="/" className="mb-3 inline-block">
                <h3 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                  <span className="text-primary">✦</span>Nomad Nodes
                  <span className="text-primary">✦</span>
                </h3>
              </Link>
            </AdminSecretAccess>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">{t("footer.tagline")}</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:border-primary hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{social.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-muted-foreground text-center text-xs">{t("footer.copyright")}</p>
          <p className="text-muted-foreground text-center text-xs">{t("footer.built_on")}</p>
        </div>
      </div>
    </footer>
  );
}
