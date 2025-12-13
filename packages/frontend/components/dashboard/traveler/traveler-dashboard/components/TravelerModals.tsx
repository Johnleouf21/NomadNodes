"use client";

import { formatTravelerRating, type PonderTraveler } from "@/hooks/usePonderTraveler";
import { type PonderReview } from "@/hooks/usePonderReviews";
import { BookingDetailSheet, CancelBookingModal, RoomDetailModal } from "../../../booking";
import { ReviewSubmissionForm, ReviewsModal } from "@/components/review";
import { BookingMessaging } from "@/components/messaging";
import type { BookingSummary } from "../../types";

interface TravelerModalsProps {
  // Booking detail
  selectedBooking: BookingSummary | null;
  detailSheetOpen: boolean;
  setDetailSheetOpen: (open: boolean) => void;
  handleCancelClick: () => void;
  handleReviewClick: () => void;
  getExistingReview: (booking: BookingSummary | null) => PonderReview | null | undefined;

  // Cancel
  cancelModalOpen: boolean;
  setCancelModalOpen: (open: boolean) => void;
  handleCancelSuccess: () => void;

  // Room
  roomModalOpen: boolean;
  setRoomModalOpen: (open: boolean) => void;

  // Review
  reviewModalOpen: boolean;
  setReviewModalOpen: (open: boolean) => void;
  handleReviewSuccess: () => void;

  // Messaging
  messagingOpen: boolean;
  setMessagingOpen: (open: boolean) => void;

  // Reviews modal
  reviewsModalOpen: boolean;
  setReviewsModalOpen: (open: boolean) => void;
  reviewsReceived: PonderReview[];
  reviewsGiven: PonderReview[];
  calculatedAvgRating: number | null;
  nonFlaggedReviewCount: number;
  traveler: PonderTraveler | null | undefined;
}

/**
 * All modals for traveler dashboard
 */
export function TravelerModals({
  selectedBooking,
  detailSheetOpen,
  setDetailSheetOpen,
  handleCancelClick,
  handleReviewClick,
  getExistingReview,
  cancelModalOpen,
  setCancelModalOpen,
  handleCancelSuccess,
  roomModalOpen,
  setRoomModalOpen,
  reviewModalOpen,
  setReviewModalOpen,
  handleReviewSuccess,
  messagingOpen,
  setMessagingOpen,
  reviewsModalOpen,
  setReviewsModalOpen,
  reviewsReceived,
  reviewsGiven,
  calculatedAvgRating,
  nonFlaggedReviewCount,
  traveler,
}: TravelerModalsProps) {
  return (
    <>
      <BookingDetailSheet
        booking={selectedBooking}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onCancelClick={handleCancelClick}
        onReviewClick={handleReviewClick}
        onMessage={() => {
          setDetailSheetOpen(false);
          setMessagingOpen(true);
        }}
        existingReview={getExistingReview(selectedBooking)}
      />

      <CancelBookingModal
        booking={selectedBooking}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onSuccess={handleCancelSuccess}
      />

      <RoomDetailModal
        tokenId={selectedBooking?.tokenId || null}
        propertyId={selectedBooking?.propertyId || null}
        propertyName={selectedBooking?.propertyName || ""}
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
      />

      {/* Review Form Modal */}
      {reviewModalOpen &&
        selectedBooking &&
        selectedBooking.escrowAddress &&
        selectedBooking.hostAddress && (
          <ReviewSubmissionForm
            booking={{
              id: selectedBooking.id,
              propertyId: selectedBooking.propertyId,
              propertyName: selectedBooking.propertyName,
              roomName: selectedBooking.roomName,
              tokenId: selectedBooking.tokenId,
              bookingIndex: selectedBooking.bookingIndex,
              checkOut: selectedBooking.checkOut,
              location: selectedBooking.location,
              image: selectedBooking.image,
              escrowAddress: selectedBooking.escrowAddress,
              hostAddress: selectedBooking.hostAddress,
              travelerAddress: selectedBooking.travelerAddress,
            }}
            open={reviewModalOpen}
            onOpenChange={setReviewModalOpen}
            onSuccess={handleReviewSuccess}
            isTravelerReview={true}
          />
        )}

      {/* Messaging Modal */}
      <BookingMessaging
        open={messagingOpen}
        onOpenChange={setMessagingOpen}
        peerAddress={selectedBooking?.hostAddress || ""}
        bookingId={selectedBooking?.id || ""}
        propertyName={selectedBooking?.propertyName || ""}
        isHost={false}
      />

      {/* Reviews Modal */}
      <ReviewsModal
        open={reviewsModalOpen}
        onOpenChange={setReviewsModalOpen}
        reviewsReceived={reviewsReceived}
        reviewsGiven={reviewsGiven}
        averageRating={
          calculatedAvgRating ?? (traveler ? formatTravelerRating(traveler.averageRating) : 0)
        }
        totalReviews={
          nonFlaggedReviewCount > 0
            ? nonFlaggedReviewCount
            : traveler
              ? Number(traveler.totalReviewsReceived)
              : 0
        }
      />
    </>
  );
}
