import { Hono } from "hono";
import { cors } from "hono/cors";
import { tunnel } from "./routes/tunnel";

const app = new Hono()
  .basePath("api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/tunnel", tunnel);

export type AppType = typeof app;
export default app;
