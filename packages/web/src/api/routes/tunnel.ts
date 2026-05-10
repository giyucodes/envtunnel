import { Hono } from "hono";
import { Redis } from "@upstash/redis";
import { redis as defaultRedis, TUNNEL_TTL } from "../lib/redis";
import { randomUUID } from "crypto";

// Build a Redis client — use custom creds if provided, else fall back to server default
function getRedis(url?: string, token?: string): Redis {
  if (url && token) {
    return new Redis({ url, token });
  }
  return defaultRedis;
}

export const tunnel = new Hono()
  // POST /api/tunnel/push
  .post("/push", async (c) => {
    const body = await c.req.json<{
      payload: string;
      iv: string;
      label?: string;
      redisUrl?: string;
      redisToken?: string;
    }>();

    if (!body.payload || !body.iv) {
      return c.json({ error: "payload and iv are required" }, 400);
    }

    const redis = getRedis(body.redisUrl, body.redisToken);
    const token = randomUUID();
    const key = `tunnel:${token}`;

    const data = {
      payload: body.payload,
      iv: body.iv,
      label: body.label ?? "untitled",
      createdAt: Date.now(),
      expiresAt: Date.now() + TUNNEL_TTL * 1000,
    };

    await redis.set(key, JSON.stringify(data), { ex: TUNNEL_TTL });

    return c.json({ token, expiresIn: TUNNEL_TTL, expiresAt: data.expiresAt, label: data.label }, 201);
  })

  // GET /api/tunnel/pull/:token — fetch only, does NOT delete
  .get("/pull/:token", async (c) => {
    const token = c.req.param("token");
    const key = `tunnel:${token}`;

    // Support custom redis via query params for pull
    const redisUrl = c.req.query("redisUrl");
    const redisToken = c.req.query("redisToken");
    const redis = getRedis(redisUrl, redisToken);

    const raw = await redis.get<string>(key);
    if (!raw) return c.json({ error: "Token not found or already used" }, 404);

    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    return c.json({ payload: data.payload, iv: data.iv, label: data.label, createdAt: data.createdAt }, 200);
  })

  // DELETE /api/tunnel/consume/:token — called after successful decryption
  .delete("/consume/:token", async (c) => {
    const token = c.req.param("token");
    const key = `tunnel:${token}`;

    const redisUrl = c.req.query("redisUrl");
    const redisToken = c.req.query("redisToken");
    const redis = getRedis(redisUrl, redisToken);

    const deleted = await redis.del(key);
    if (!deleted) return c.json({ error: "Token not found" }, 404);

    return c.json({ success: true }, 200);
  })

  // GET /api/tunnel/peek/:token
  .get("/peek/:token", async (c) => {
    const token = c.req.param("token");
    const key = `tunnel:${token}`;

    const redisUrl = c.req.query("redisUrl");
    const redisToken = c.req.query("redisToken");
    const redis = getRedis(redisUrl, redisToken);

    const ttl = await redis.ttl(key);
    if (ttl <= 0) return c.json({ exists: false }, 200);

    const raw = await redis.get<string>(key);
    if (!raw) return c.json({ exists: false }, 200);

    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    return c.json({ exists: true, ttl, label: data.label, createdAt: data.createdAt, expiresAt: data.expiresAt }, 200);
  })

  // POST /api/tunnel/validate-redis — test custom upstash creds
  .post("/validate-redis", async (c) => {
    const body = await c.req.json<{ redisUrl: string; redisToken: string }>();
    if (!body.redisUrl || !body.redisToken) {
      return c.json({ error: "redisUrl and redisToken are required" }, 400);
    }
    try {
      const redis = new Redis({ url: body.redisUrl, token: body.redisToken });
      await redis.ping();
      return c.json({ success: true }, 200);
    } catch (e: any) {
      return c.json({ error: "Connection failed: " + e.message }, 400);
    }
  });
