"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
}

interface PropertyCreationStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function PropertyCreationStepper({
  steps,
  currentStep,
  onStepClick,
}: PropertyCreationStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;

          return (
            <li
              key={step.title}
              className={cn(
                "relative flex flex-1 flex-col items-center",
                index !== steps.length - 1 &&
                  "after:bg-border after:absolute after:top-5 after:left-[50%] after:h-[2px] after:w-full"
              )}
            >
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !isCompleted &&
                    !isCurrent &&
                    "border-muted-foreground/30 bg-background text-muted-foreground",
                  isClickable && "hover:border-primary cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-foreground",
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-muted-foreground hidden text-xs md:block">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
