"use client";

import * as React from "react";
import Link from "next/link";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.about"), href: "/about" },
        { label: t("footer.careers"), href: "/careers" },
        { label: t("footer.press"), href: "/press" },
        { label: t("footer.blog"), href: "/blog" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.help_center"), href: "/help" },
        { label: t("footer.safety"), href: "/safety" },
        { label: t("footer.contact"), href: "/contact" },
        { label: t("footer.community_forum"), href: "/forum" },
      ],
    },
    {
      title: t("footer.hosts"),
      links: [
        { label: t("footer.host_home"), href: "/host" },
        { label: t("footer.host_resources"), href: "/host/resources" },
        { label: t("nav.my_properties"), href: "/properties" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.cookies"), href: "/cookies" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/nomadnodes", label: "Twitter" },
    { icon: Github, href: "https://github.com/nomadnodes", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/company/nomadnodes", label: "LinkedIn" },
    { icon: Mail, href: "mailto:contact@nomadnodes.com", label: "Email" },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <h3 className="from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                NomadNodes
              </h3>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">{t("footer.tagline")}</p>
            <div className="flex items-center gap-4">
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
              <h4 className="mb-4 text-sm font-semibold">{section.title}</h4>
              <ul className="space-y-3">
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

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-center text-sm">{t("footer.copyright")}</p>
          <p className="text-muted-foreground text-center text-sm">{t("footer.built_on")}</p>
        </div>
      </div>
    </footer>
  );
}
