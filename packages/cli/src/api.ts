const DEFAULT_API = "https://envtunnel.runable.site";

export function getApiBase(): string {
  return process.env.ENVTUNNEL_API ?? DEFAULT_API;
}

export interface RedisOpts {
  redisUrl?: string;
  redisToken?: string;
}

function redisQuery(opts: RedisOpts): string {
  const params = new URLSearchParams();
  if (opts.redisUrl) params.set("redisUrl", opts.redisUrl);
  if (opts.redisToken) params.set("redisToken", opts.redisToken);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function pushTunnel(
  payload: string,
  iv: string,
  label: string,
  apiBase: string,
  redis: RedisOpts = {}
): Promise<{ token: string; expiresAt: number; expiresIn: number; label: string }> {
  const res = await fetch(`${apiBase}/api/tunnel/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, iv, label, ...redis }),
  });

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error ?? "Push failed");
  return data;
}

export async function pullTunnel(
  token: string,
  apiBase: string,
  redis: RedisOpts = {}
): Promise<{ payload: string; iv: string; label: string }> {
  const res = await fetch(`${apiBase}/api/tunnel/pull/${token}${redisQuery(redis)}`);
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error ?? "Token not found or already used");
  return data;
}

export async function consumeTunnel(
  token: string,
  apiBase: string,
  redis: RedisOpts = {}
): Promise<void> {
  await fetch(`${apiBase}/api/tunnel/consume/${token}${redisQuery(redis)}`, { method: "DELETE" });
}

export async function peekTunnel(
  token: string,
  apiBase: string,
  redis: RedisOpts = {}
): Promise<{ exists: boolean; ttl?: number; label?: string }> {
  const res = await fetch(`${apiBase}/api/tunnel/peek/${token}${redisQuery(redis)}`);
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error ?? "Peek failed");
  return data;
}
