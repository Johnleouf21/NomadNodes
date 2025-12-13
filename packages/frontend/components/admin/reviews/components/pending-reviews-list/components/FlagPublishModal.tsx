"use client";

/**
 * Modal for Flag & Publish flow
 */

import * as React from "react";
import { Flag, Loader2, Shield, Eye, Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { PendingReviewData } from "@/lib/hooks/contracts/adminReviews";
import type { FlagPublishStep } from "../../../types";
import { RatingStars } from "../../RatingStars";
import { ReviewCommentDisplay } from "../../ReviewCommentDisplay";
import { cn } from "@/lib/utils";
import { EasterEggBadge, FloatingIconConfig } from "@/components/easter-eggs/shared/EasterEggBadge";

// Guardian icons for floating effect
const GUARDIAN_ICONS: FloatingIconConfig[] = [
  { icon: Shield, color: "#EAB308" },
  { icon: Eye, color: "#8B5CF6" },
  { icon: Scale, color: "#F59E0B" },
  { icon: Sparkles, color: "#10B981" },
];

interface FlagPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PendingReviewData | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  step: FlagPublishStep;
  onStart: () => void;
  onClose: () => void;
  isApproving: boolean;
  isPublishing: boolean;
  isFlagging: boolean;
}

/**
 * Dialog for Flag & Publish multi-step flow
 */
export function FlagPublishModal({
  open,
  onOpenChange,
  review,
  reason,
  onReasonChange,
  step,
  onStart,
  onClose,
  isApproving,
  isPublishing,
  isFlagging,
}: FlagPublishModalProps) {
  // 🛡️ Easter egg for Eve - the guardian of reviews
  const [guardianMode, setGuardianMode] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(false);
  const guardianShownRef = React.useRef(false);

  React.useEffect(() => {
    const secretWords = ["eve", "guardian", "gardienne"];
    const isGuardian = secretWords.some((word) => reason.toLowerCase().includes(word));

    if (isGuardian && !guardianShownRef.current) {
      setGuardianMode(true);
      guardianShownRef.current = true;
      setShowBadge(true);

      toast("🛡️ Eve, gardienne des reviews, veille sur la communauté !", {
        icon: <Shield className="h-5 w-5 text-yellow-500" />,
        duration: 5000,
      });
    } else if (!isGuardian) {
      setGuardianMode(false);
      guardianShownRef.current = false;
    }
  }, [reason]);

  const closeBadge = React.useCallback(() => {
    setShowBadge(false);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && step === "idle") {
      onClose();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag
              className={cn(
                "h-5 w-5 transition-all duration-300",
                guardianMode
                  ? "animate-pulse text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                  : "text-orange-500"
              )}
            />
            Flag & Publish Review
          </DialogTitle>
          <DialogDescription>
            This will publish the review AND immediately flag it as inappropriate. The review will
            be visible on-chain with a flag, exposing the user&apos;s behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {review && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <RatingStars rating={review.rating} />
                <span className="text-muted-foreground">
                  by {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                </span>
              </div>
              <ReviewCommentDisplay ipfsHash={review.ipfsCommentHash} />
            </div>
          )}
          <div>
            <Label htmlFor="flag-reason">Flag Reason</Label>
            <Textarea
              id="flag-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g., hate_speech, harassment, spam, fake_review, inappropriate_content"
              className="mt-2"
              disabled={step !== "idle"}
            />
          </div>
          {step !== "idle" && step !== "done" && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {step === "approving" && "Step 1/3: Approving review..."}
                {step === "publishing" && "Step 2/3: Publishing review..."}
                {step === "flagging" && "Step 3/3: Flagging review..."}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={step !== "idle"}>
            Cancel
          </Button>
          <Button
            variant="default"
            className={cn(
              "transition-all duration-300",
              guardianMode
                ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:bg-yellow-600"
                : "bg-orange-500 hover:bg-orange-600"
            )}
            onClick={onStart}
            disabled={
              step !== "idle" || !reason.trim() || isApproving || isPublishing || isFlagging
            }
          >
            <Flag className="mr-2 h-4 w-4" />
            {guardianMode ? "🛡️ Guardian Flag" : "Flag & Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Eve Guardian Badge Popup */}
      <EasterEggBadge
        show={showBadge}
        onClose={closeBadge}
        autoCloseMs={6000}
        zIndex={200}
        backgroundGradient="bg-gradient-to-br from-yellow-900/90 via-amber-800/90 to-yellow-900/90"
        floatingIcons={GUARDIAN_ICONS}
        floatingIconsCount={15}
        badgeGradient="bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-600"
        badgeBorderColor="rgba(234, 179, 8, 0.5)"
        glowGradient="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500"
        mainIcon={<Shield className="h-16 w-16 text-white drop-shadow-lg" />}
        miniIcons={[
          {
            icon: <Eye className="h-6 w-6" />,
            gradient: "bg-gradient-to-r from-purple-500 to-indigo-500",
            position: "top-right",
            bounce: true,
          },
          {
            icon: <Scale className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
            position: "bottom-left",
          },
          {
            icon: <Sparkles className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-emerald-500 to-green-500",
            position: "bottom-right",
          },
        ]}
        subtitle="🛡️ Guardian Mode Activated"
        subtitleColor="text-yellow-400"
        title="Eve"
        titleGradient="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"
        role="The Guardian of Reviews"
        quote={
          <>
            &quot;La vérité finit toujours par émerger.
            <br />
            Je veille sur chaque avis.&quot; 👁️
          </>
        }
        tags={[
          { emoji: "🛡️", label: "Moderation" },
          { emoji: "⚖️", label: "Justice" },
          { emoji: "👁️", label: "Vigilance" },
          { emoji: "✨", label: "Integrity" },
        ]}
        tagBgColor="bg-yellow-900/50"
        tagTextColor="text-yellow-300"
        tagBorderColor="border-yellow-500/30"
        bouncingEmojis={["🛡️", "⚔️", "👑", "⚔️", "🛡️"]}
      />
    </Dialog>
  );
}
