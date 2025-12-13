"use client";

import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function FAQPage() {
  const { t } = useTranslation();

  const faqCategories = [
    {
      title: t("faq.categories.general"),
      questions: [
        { q: t("faq.general.q1"), a: t("faq.general.a1") },
        { q: t("faq.general.q2"), a: t("faq.general.a2") },
        { q: t("faq.general.q3"), a: t("faq.general.a3") },
      ],
    },
    {
      title: t("faq.categories.blockchain"),
      questions: [
        { q: t("faq.blockchain.q1"), a: t("faq.blockchain.a1") },
        { q: t("faq.blockchain.q2"), a: t("faq.blockchain.a2") },
        { q: t("faq.blockchain.q3"), a: t("faq.blockchain.a3") },
        { q: t("faq.blockchain.q4"), a: t("faq.blockchain.a4") },
      ],
    },
    {
      title: t("faq.categories.booking"),
      questions: [
        { q: t("faq.booking.q1"), a: t("faq.booking.a1") },
        { q: t("faq.booking.q2"), a: t("faq.booking.a2") },
        { q: t("faq.booking.q3"), a: t("faq.booking.a3") },
        { q: t("faq.booking.q4"), a: t("faq.booking.a4") },
      ],
    },
    {
      title: t("faq.categories.hosting"),
      questions: [
        { q: t("faq.hosting.q1"), a: t("faq.hosting.a1") },
        { q: t("faq.hosting.q2"), a: t("faq.hosting.a2") },
        { q: t("faq.hosting.q3"), a: t("faq.hosting.a3") },
      ],
    },
    {
      title: t("faq.categories.security"),
      questions: [
        { q: t("faq.security.q1"), a: t("faq.security.a1") },
        { q: t("faq.security.q2"), a: t("faq.security.a2") },
        { q: t("faq.security.q3"), a: t("faq.security.a3") },
      ],
    },
  ];

  return (
    <div className="container px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="bg-primary/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <HelpCircle className="text-primary h-8 w-8" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">{t("faq.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("faq.subtitle")}</p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-xl">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-12">
          <CardContent className="py-8 text-center">
            <h3 className="mb-2 text-xl font-semibold">{t("faq.still_questions")}</h3>
            <p className="text-muted-foreground mb-4">{t("faq.contact_text")}</p>
            <a href="mailto:contact@nomadnodes.com" className="text-primary hover:underline">
              contact@nomadnodes.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
