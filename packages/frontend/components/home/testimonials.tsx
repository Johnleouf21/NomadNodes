"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface Testimonial {
  key: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  { key: "1", rating: 5, avatar: "🧑‍💻" },
  { key: "2", rating: 5, avatar: "👩‍🎨" },
  { key: "3", rating: 5, avatar: "🧑‍🚀" },
];

export function Testimonials() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">{t("testimonials.subtitle")}</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.key}
              className={`group relative overflow-hidden transition-all duration-500 hover:shadow-lg ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="text-primary/20 mb-4 h-8 w-8" />

                {/* Rating */}
                <div className="mb-4 flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  &ldquo;{t(`testimonials.reviews.${testimonial.key}.text`)}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {t(`testimonials.reviews.${testimonial.key}.name`)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t(`testimonials.reviews.${testimonial.key}.role`)}
                    </p>
                  </div>
                </div>

                {/* Hover gradient */}
                <div className="from-primary/5 absolute inset-0 -z-10 bg-gradient-to-br to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-muted-foreground/60 mt-8 text-center text-xs italic">
          {t("testimonials.disclaimer")}
        </p>
      </div>
    </section>
  );
}
