#!/usr/bin/env node

/**
 * Quick config validation for Railway deployment
 * Run: node check-config.js
 */

/* eslint-disable no-console */

console.log("🔍 Checking Ponder indexer configuration for Railway deployment...\n");

// Required environment variables
const required = [
  "PONDER_CHAIN",
  "PROPERTY_REGISTRY_ADDRESS",
  "ROOM_TYPE_NFT_ADDRESS",
  "BOOKING_MANAGER_ADDRESS",
  "ESCROW_FACTORY_ADDRESS",
  "REVIEW_REGISTRY_ADDRESS",
  "TRAVELER_SBT_ADDRESS",
  "HOST_SBT_ADDRESS",
  "START_BLOCK",
];

// Optional but recommended
const recommended = ["PONDER_RPC_URL_11155111", "DATABASE_URL"];

let hasErrors = false;
let hasWarnings = false;

console.log("✅ Required Variables:");
required.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    console.log(`  ❌ ${key}: MISSING`);
    hasErrors = true;
  } else {
    const display = value.length > 50 ? value.slice(0, 47) + "..." : value;
    console.log(`  ✓ ${key}: ${display}`);
  }
});

console.log("\n⚠️  Recommended Variables:");
recommended.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    console.log(`  ⚠️  ${key}: Not set (will use defaults)`);
    hasWarnings = true;
  } else {
    const display = value.length > 50 ? value.slice(0, 47) + "..." : value;
    console.log(`  ✓ ${key}: ${display}`);
  }
});

console.log("\n📦 Checking files...");

const fs = require("fs");
const path = require("path");

const files = [
  "ponder.config.ts",
  "ponder.schema.ts",
  "package.json",
  "Dockerfile",
  ".dockerignore",
  "abis/index.ts",
];

files.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (!exists) {
    console.log(`  ❌ ${file}: MISSING`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${file}`);
  }
});

console.log("\n📊 Summary:");
if (hasErrors) {
  console.log("  ❌ Configuration has errors. Fix them before deploying to Railway.");
  process.exit(1);
} else if (hasWarnings) {
  console.log("  ⚠️  Configuration has warnings. Deployment will work but may not be optimal.");
  console.log("  ✓ Ready to deploy to Railway!");
  process.exit(0);
} else {
  console.log("  ✅ All checks passed! Ready to deploy to Railway.");
  process.exit(0);
}
