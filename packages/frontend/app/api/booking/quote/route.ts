import { NextRequest, NextResponse } from "next/server";
import { keccak256, encodePacked, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * API Route: POST /api/booking/quote
 * Signs a booking quote for the EscrowFactory contract
 *
 * Request body:
 * - tokenId: string (bigint as string)
 * - checkIn: number (Unix timestamp)
 * - checkOut: number (Unix timestamp)
 * - price: string (bigint as string, in token decimals)
 * - currency: string (token address)
 * - quantity: number (optional, defaults to 1)
 *
 * Response:
 * - signature: string (hex)
 * - validUntil: number (Unix timestamp)
 * - quantity: number
 */

// Quote validity period: 10 minutes
const QUOTE_VALIDITY_SECONDS = 600;

// Chain ID (Sepolia = 11155111, Localhost = 31337)
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

// EscrowFactory contract address (for replay protection in signature)
const ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS as `0x${string}`;

interface QuoteRequest {
  tokenId: string;
  checkIn: number;
  checkOut: number;
  price: string;
  currency: string;
  quantity?: number;
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
    const body: QuoteRequest = await request.json();

    // Validate required fields
    if (!body.tokenId || !body.checkIn || !body.checkOut || !body.price || !body.currency) {
      return NextResponse.json(
        { error: "Missing required fields: tokenId, checkIn, checkOut, price, currency" },
        { status: 400 }
      );
    }

    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);
    // Get start of today in UTC (midnight UTC) for date comparison
    // Since check-in dates are normalized to UTC midnight, we compare against today's UTC midnight
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const todayMidnightUTC = Math.floor(todayUTC.getTime() / 1000);

    if (body.checkIn < todayMidnightUTC) {
      return NextResponse.json(
        { error: "Check-in date must be today or in the future" },
        { status: 400 }
      );
    }
    if (body.checkOut <= body.checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    // Calculate validUntil timestamp
    const validUntil = now + QUOTE_VALIDITY_SECONDS;

    // Default quantity to 1 if not provided
    const quantity = body.quantity || 1;

    // Validate contract address is configured
    if (
      !ESCROW_FACTORY_ADDRESS ||
      ESCROW_FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      console.error("NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS not configured");
      return NextResponse.json({ error: "EscrowFactory address not configured" }, { status: 500 });
    }

    // Create the message hash (must match QuoteVerifier.verifyQuote)
    // keccak256(abi.encodePacked(tokenId, checkIn, checkOut, price, currency, validUntil, quantity, chainId, contractAddress))
    const messageHash = keccak256(
      encodePacked(
        [
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "uint256",
          "address",
        ],
        [
          BigInt(body.tokenId),
          BigInt(body.checkIn),
          BigInt(body.checkOut),
          BigInt(body.price),
          body.currency as `0x${string}`,
          BigInt(validUntil),
          BigInt(quantity),
          BigInt(CHAIN_ID),
          ESCROW_FACTORY_ADDRESS,
        ]
      )
    );

    // Create account from private key
    const account = privateKeyToAccount(signerPrivateKey as Hex);

    console.log("[Quote API] Signer address:", account.address);
    console.log("[Quote API] Message hash:", messageHash);
    console.log("[Quote API] Quote params:", {
      tokenId: body.tokenId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      price: body.price,
      currency: body.currency,
      validUntil,
      quantity,
      chainId: CHAIN_ID,
      escrowFactory: ESCROW_FACTORY_ADDRESS,
    });

    // Sign the message with EIP-191 prefix (toEthSignedMessageHash equivalent)
    const signature = await account.signMessage({
      message: { raw: messageHash as Hex },
    });

    console.log("[Quote API] Signature:", signature);

    return NextResponse.json({
      signature,
      validUntil,
      quantity,
      signerAddress: account.address,
    });
  } catch (error) {
    console.error("Error signing quote:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign quote" },
      { status: 500 }
    );
  }
}
