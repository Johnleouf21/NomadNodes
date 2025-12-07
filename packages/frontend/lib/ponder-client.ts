import { createClient } from "@ponder/client";
import { schema } from "./ponder-schema";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export const ponderClient = createClient(`${PONDER_URL}/sql`, { schema });
