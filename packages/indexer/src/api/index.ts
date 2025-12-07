import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql } from "ponder";

const app = new Hono();

// CORS configuration - STRICT mode
// CORS_ALLOWED_ORIGINS must be set, e.g. "http://localhost:3000,https://nomadnodes.com"
// If not set, no origins are allowed (blocks all cross-origin requests)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

if (allowedOrigins.length === 0) {
  console.warn("⚠️ CORS_ALLOWED_ORIGINS not set - all cross-origin requests will be blocked");
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      // If no origin header (same-origin request), allow it
      if (!origin) return origin;
      // Check if origin is in the allowed list
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
