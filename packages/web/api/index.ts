import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { community } from "../src/api/routes/community";

const app = new Hono()
  .basePath("/api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/community", community);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
