import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql } from "ponder";

const app = new Hono();

// CORS configuration from environment variable
// Format: comma-separated list of origins, e.g. "http://localhost:3000,https://nomadnodes.com"
// If not set, defaults to allowing all origins (for development)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  "*",
  cors({
    origin: allowedOrigins.includes("*")
      ? "*"
      : (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
