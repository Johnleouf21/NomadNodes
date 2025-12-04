import { NextRequest, NextResponse } from "next/server";
import { keccak256, encodePacked, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * API Route: POST /api/booking/batch-quote
 * Signs a batch booking quote for the EscrowFactory contract
 * Creates separate escrows per room type for individual cancellation support
 *
 * Request body:
 * - rooms: Array of { tokenId: string, quantity: number, price: string }
 * - checkIn: number (Unix timestamp)
 * - checkOut: number (Unix timestamp)
 * - totalPrice: string (bigint as string, sum of all room prices)
 * - currency: string (token address)
 *
 * Response:
 * - signature: string (hex)
 * - validUntil: number (Unix timestamp)
 * - rooms: Array with tokenId, quantity, price
 */

// Quote validity period: 10 minutes
const QUOTE_VALIDITY_SECONDS = 600;

// Chain ID (Sepolia = 11155111, Localhost = 31337)
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

// EscrowFactory contract address (for replay protection in signature)
const ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS as `0x${string}`;

interface RoomBooking {
  tokenId: string;
  quantity: number;
  price: string;
}

interface BatchQuoteRequest {
  rooms: RoomBooking[];
  checkIn: number;
  checkOut: number;
  totalPrice: string;
  currency: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the backend signer private key from environment
    const signerPrivateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;

    if (!signerPrivateKey) {
      console.error("BACKEND_SIGNER_PRIVATE_KEY not configured");
      return NextResponse.json({ error: "Backend signer not configured" }, { status: 500 });
    }

    // Parse request body
    const body: BatchQuoteRequest = await request.json();

    // Validate required fields
    if (!body.rooms || body.rooms.length === 0) {
      return NextResponse.json({ error: "At least one room is required" }, { status: 400 });
    }

    if (!body.checkIn || !body.checkOut || !body.totalPrice || !body.currency) {
      return NextResponse.json(
        { error: "Missing required fields: checkIn, checkOut, totalPrice, currency" },
        { status: 400 }
      );
    }

    // Validate each room
    for (const room of body.rooms) {
      if (!room.tokenId || !room.quantity || !room.price) {
        return NextResponse.json(
          { error: "Each room must have tokenId, quantity, and price" },
          { status: 400 }
        );
      }
    }

    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);
    const todayMidnight = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

    if (body.checkIn < todayMidnight) {
      return NextResponse.json(
        { error: "Check-in date must be today or in the future" },
        { status: 400 }
      );
    }
    if (body.checkOut <= body.checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    // Verify price sum matches totalPrice
    const priceSum = body.rooms.reduce((sum, room) => sum + BigInt(room.price), 0n);
    if (priceSum !== BigInt(body.totalPrice)) {
      return NextResponse.json(
        { error: "Sum of room prices must equal totalPrice" },
        { status: 400 }
      );
    }

    // Calculate validUntil timestamp
    const validUntil = now + QUOTE_VALIDITY_SECONDS;

    // Validate contract address is configured
    if (
      !ESCROW_FACTORY_ADDRESS ||
      ESCROW_FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      console.error("NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS not configured");
      return NextResponse.json({ error: "EscrowFactory address not configured" }, { status: 500 });
    }

    // Create the message hash (must match QuoteVerifier.verifyBatchQuote)
    // Step 1: Hash room bookings as keccak256(abi.encodePacked(tokenIds[], quantities[], prices[]))
    // This matches QuoteVerifier.hashRoomBookings
    const tokenIds = body.rooms.map((r) => BigInt(r.tokenId));
    const quantities = body.rooms.map((r) => BigInt(r.quantity));
    const prices = body.rooms.map((r) => BigInt(r.price));

    // Create type arrays for encodePacked
    const tokenIdTypes = tokenIds.map(() => "uint256" as const);
    const quantityTypes = quantities.map(() => "uint256" as const);
    const priceTypes = prices.map(() => "uint256" as const);

    const roomsHash = keccak256(
      encodePacked(
        [...tokenIdTypes, ...quantityTypes, ...priceTypes],
        [...tokenIds, ...quantities, ...prices]
      )
    );

    // Step 2: Final message hash with chainId and contractAddress
    // keccak256(abi.encodePacked(roomsHash, checkIn, checkOut, totalPrice, currency, validUntil, chainId, contractAddress))
    const messageHash = keccak256(
      encodePacked(
        ["bytes32", "uint256", "uint256", "uint256", "address", "uint256", "uint256", "address"],
        [
          roomsHash,
          BigInt(body.checkIn),
          BigInt(body.checkOut),
          BigInt(body.totalPrice),
          body.currency as `0x${string}`,
          BigInt(validUntil),
          BigInt(CHAIN_ID),
          ESCROW_FACTORY_ADDRESS,
        ]
      )
    );

    // Create account from private key
    const account = privateKeyToAccount(signerPrivateKey as Hex);

    console.log("[Batch Quote API] Signer address:", account.address);
    console.log("[Batch Quote API] Rooms hash:", roomsHash);
    console.log("[Batch Quote API] Message hash:", messageHash);
    console.log("[Batch Quote API] Quote params:", {
      rooms: body.rooms,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      totalPrice: body.totalPrice,
      currency: body.currency,
      validUntil,
      chainId: CHAIN_ID,
      escrowFactory: ESCROW_FACTORY_ADDRESS,
    });

    // Sign the message with EIP-191 prefix (toEthSignedMessageHash equivalent)
    const signature = await account.signMessage({
      message: { raw: messageHash as Hex },
    });

    console.log("[Batch Quote API] Signature:", signature);

    return NextResponse.json({
      signature,
      validUntil,
      rooms: body.rooms.map((room) => ({
        tokenId: room.tokenId,
        quantity: room.quantity,
        price: room.price,
      })),
      totalPrice: body.totalPrice,
      signerAddress: account.address,
    });
  } catch (error) {
    console.error("Error signing batch quote:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign batch quote" },
      { status: 500 }
    );
  }
}
