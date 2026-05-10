import { useState } from "react";
import { Link } from "wouter";
import {
  Terminal, Plus, Copy, Check, ArrowLeft, Clock, Trash2,
  Eye, EyeOff, Upload, Download, RefreshCw, Settings, X,
  ChevronDown, ChevronUp, Wifi,
} from "lucide-react";
import { encryptEnv, decryptEnv } from "../lib/crypto";
import { generatePassphrase } from "../lib/passphrase";

type ActiveTunnel = { token: string; label: string; createdAt: number; expiresAt: number };
type Tab = "push" | "pull";

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text, label = "copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: "transparent", border: "1px solid var(--border2)",
      color: copied ? "var(--accent)" : "var(--muted2)", padding: "6px 12px",
      cursor: "pointer", fontSize: 12, fontFamily: "JetBrains Mono, monospace",
      display: "inline-flex", alignItems: "center", gap: 6, transition: "color 0.15s",
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "copied!" : label}
    </button>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(Date.now());
  useState(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  });
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <span style={{ color: remaining < 60 ? "var(--danger)" : "var(--warning)", fontSize: 12, fontWeight: 600 }}>
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

// ─── RedisConfig panel ────────────────────────────────────────────────────────
function RedisConfigPanel({
  redisUrl, setRedisUrl, redisToken, setRedisToken,
}: {
  redisUrl: string; setRedisUrl: (v: string) => void;
  redisToken: string; setRedisToken: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [showToken, setShowToken] = useState(false);

  const isCustom = redisUrl.trim() && redisToken.trim();

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/tunnel/validate-redis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redisUrl: redisUrl.trim(), redisToken: redisToken.trim() }),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  };

  const clear = () => { setRedisUrl(""); setRedisToken(""); setTestResult(null); };

  return (
    <div style={{ border: "1px solid var(--border)", marginBottom: 24 }}>
      {/* Header */}
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "var(--surface2)", border: "none",
        cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={13} color="var(--muted2)" />
          <span style={{ fontSize: 12, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            upstash config
          </span>
          {isCustom && (
            <span style={{
              fontSize: 10, padding: "2px 7px", border: "1px solid var(--accent-border)",
              color: "var(--accent)", background: "var(--accent-dim)", letterSpacing: "0.06em",
            }}>
              ● custom
            </span>
          )}
          {!isCustom && (
            <span style={{
              fontSize: 10, padding: "2px 7px", border: "1px solid var(--border2)",
              color: "var(--muted)", letterSpacing: "0.06em",
            }}>
              server default
            </span>
          )}
        </div>
        {open ? <ChevronUp size={13} color="var(--muted2)" /> : <ChevronDown size={13} color="var(--muted2)" />}
      </button>

      {open && (
        <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Info box */}
          <div style={{
            padding: "10px 14px", background: "rgba(0,255,136,0.04)",
            border: "1px solid var(--accent-border)", fontSize: 12, color: "var(--muted2)", lineHeight: 1.7,
          }}>
            Use your own Upstash Redis for full privacy — your env vars never touch the server's storage.
            Get free creds at{" "}
            <a href="https://console.upstash.com" target="_blank" rel="noreferrer"
              style={{ color: "var(--accent)" }}>console.upstash.com</a>.
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              REST URL
            </div>
            <input className="input" placeholder="https://xxx.upstash.io"
              value={redisUrl} onChange={e => { setRedisUrl(e.target.value); setTestResult(null); }} />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              REST Token
            </div>
            <div style={{ position: "relative" }}>
              <input className="input" type={showToken ? "text" : "password"}
                placeholder="AXxx..." value={redisToken}
                onChange={e => { setRedisToken(e.target.value); setTestResult(null); }}
                style={{ paddingRight: 44 }} />
              <button onClick={() => setShowToken(!showToken)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", color: "var(--muted2)", cursor: "pointer", display: "flex",
              }}>
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn-secondary" onClick={testConnection}
              disabled={testing || !redisUrl.trim() || !redisToken.trim()}
              style={{ padding: "7px 14px", fontSize: 11 }}>
              <Wifi size={12} />
              {testing ? "testing..." : "test connection"}
            </button>
            {isCustom && (
              <button onClick={clear} style={{
                background: "transparent", border: "1px solid var(--border2)", color: "var(--muted2)",
                padding: "7px 12px", cursor: "pointer", fontSize: 11,
                fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 6,
              }}>
                <X size={11} /> use server default
              </button>
            )}
            {testResult === "ok" && (
              <span style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={12} /> connected
              </span>
            )}
            {testResult === "fail" && (
              <span style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={12} /> failed — check creds
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PassphraseInput ──────────────────────────────────────────────────────────
function PassphraseInput({
  value, onChange, placeholder = "strong passphrase...", showGenerate = true,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; showGenerate?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const p = generatePassphrase(4);
    onChange(p);
    setShow(true); // reveal so user can see what was generated
  };

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ position: "relative" }}>
        <input className="input" type={show ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)} style={{ paddingRight: 44 }} />
        <button onClick={() => setShow(!show)} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "transparent", border: "none", color: "var(--muted2)", cursor: "pointer", display: "flex",
        }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Actions row */}
      <div style={{ display: "flex", gap: 8 }}>
        {showGenerate && (
          <button onClick={generate} style={{
            background: "transparent", border: "1px solid var(--border2)", color: "var(--muted2)",
            padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "JetBrains Mono, monospace",
            display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s, color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"; }}
          >
            <RefreshCw size={11} /> generate passphrase
          </button>
        )}

        <button onClick={copy} disabled={!value} style={{
          background: "transparent", border: "1px solid var(--border2)",
          color: copied ? "var(--accent)" : "var(--muted2)", padding: "6px 12px",
          cursor: value ? "pointer" : "not-allowed", fontSize: 11, opacity: value ? 1 : 0.4,
          fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 6,
        }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "copied!" : "copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("push");

  // Shared custom redis
  const [redisUrl, setRedisUrl] = useState("");
  const [redisToken, setRedisToken] = useState("");

  // Push state
  const [envInput, setEnvInput] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [label, setLabel] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<ActiveTunnel | null>(null);
  const [tunnels, setTunnels] = useState<ActiveTunnel[]>([]);

  // Pull state
  const [pullToken, setPullToken] = useState("");
  const [pullPassphrase, setPullPassphrase] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<string | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  const customRedis = redisUrl.trim() && redisToken.trim()
    ? { redisUrl: redisUrl.trim(), redisToken: redisToken.trim() }
    : {};

  const handlePush = async () => {
    if (!envInput.trim() || !passphrase.trim()) return;
    setPushing(true); setPushResult(null);
    try {
      const { payload, iv } = await encryptEnv(envInput.trim(), passphrase);
      const res = await fetch("/api/tunnel/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, iv, label: label || "untitled", ...customRedis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      const tunnel: ActiveTunnel = { token: data.token, label: data.label, createdAt: Date.now(), expiresAt: data.expiresAt };
      setPushResult(tunnel);
      setTunnels(prev => [tunnel, ...prev]);
      setEnvInput(""); setLabel("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPushing(false);
    }
  };

  const handlePull = async () => {
    if (!pullToken.trim() || !pullPassphrase.trim()) return;
    setPulling(true); setPullResult(null); setPullError(null);
    try {
      const qs = redisUrl && redisToken
        ? `?redisUrl=${encodeURIComponent(redisUrl)}&redisToken=${encodeURIComponent(redisToken)}`
        : "";

      const res = await fetch(`/api/tunnel/pull/${pullToken.trim()}${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pull failed");

      const decrypted = await decryptEnv(data.payload, data.iv, pullPassphrase);

      await fetch(`/api/tunnel/consume/${pullToken.trim()}${qs}`, { method: "DELETE" });

      setPullResult(decrypted);
      setTunnels(prev => prev.filter(t => t.token !== pullToken.trim()));
    } catch (err: any) {
      if (err.name === "OperationError" || err.message?.includes("decrypt")) {
        setPullError("Wrong passphrase — decryption failed. Token is still alive, try again.");
      } else {
        setPullError(err.message);
      }
    } finally {
      setPulling(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)", padding: "0 40px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(8px)", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/">
            <button style={{
              background: "transparent", border: "none", color: "var(--muted2)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontFamily: "JetBrains Mono, monospace",
            }}>
              <ArrowLeft size={14} /> back
            </button>
          </Link>
          <div style={{ color: "var(--border2)" }}>|</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
            <Terminal size={14} color="var(--accent)" />
            envtunnel / dashboard
          </div>
        </div>
        <div className="badge badge-green">● system online</div>
      </nav>

      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "40px",
        display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start",
      }}>
        {/* Main panel */}
        <div>
          {/* Redis config — shared across tabs */}
          <RedisConfigPanel
            redisUrl={redisUrl} setRedisUrl={setRedisUrl}
            redisToken={redisToken} setRedisToken={setRedisToken}
          />

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 32 }}>
            {(["push", "pull"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "12px 24px", background: "transparent", border: "none",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--text)" : "var(--muted2)",
                fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                fontWeight: tab === t ? 700 : 400, textTransform: "uppercase",
                letterSpacing: "0.06em", cursor: "pointer", marginBottom: -1,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {t === "push" ? <Upload size={13} /> : <Download size={13} />}
                {t}
              </button>
            ))}
          </div>

          {/* ── PUSH TAB ── */}
          {tab === "push" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="section-label">encrypt + push env vars</div>

              {/* Label */}
              <div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  label (optional)
                </div>
                <input className="input" placeholder="e.g. staging-env"
                  value={label} onChange={e => setLabel(e.target.value)} />
              </div>

              {/* Passphrase */}
              <div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  passphrase — share this separately, not with the token
                </div>
                <PassphraseInput value={passphrase} onChange={setPassphrase} />
              </div>

              {/* Env vars */}
              <div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  env vars — paste your .env contents
                </div>
                <textarea className="input" rows={10}
                  placeholder={"DATABASE_URL=postgres://...\nAPI_KEY=sk-...\nNODE_ENV=production"}
                  value={envInput} onChange={e => setEnvInput(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "JetBrains Mono, monospace" }} />
              </div>

              <button className="btn-primary" onClick={handlePush}
                disabled={pushing || !envInput.trim() || !passphrase.trim()}
                style={{ alignSelf: "flex-start" }}>
                <Plus size={14} />
                {pushing ? "encrypting..." : "push tunnel"}
              </button>

              {/* Push result */}
              {pushResult && (
                <div style={{
                  border: "1px solid var(--accent-border)", background: "var(--accent-dim)", padding: 24,
                }}>
                  <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                    ✓ tunnel created — "{pushResult.label}"
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase" }}>token (share this)</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "var(--surface2)", border: "1px solid var(--border2)", padding: "10px 14px",
                    }}>
                      <code style={{ flex: 1, fontSize: 14, color: "var(--accent)", letterSpacing: "0.05em" }}>
                        {pushResult.token}
                      </code>
                      <CopyButton text={pushResult.token} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted2)" }}>
                    <Clock size={12} />
                    expires in <Countdown expiresAt={pushResult.expiresAt} /> — one-time use
                  </div>
                  <div style={{
                    marginTop: 16, padding: "10px 14px",
                    background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)",
                    fontSize: 12, color: "var(--warning)",
                  }}>
                    ⚠ Share the passphrase via a separate channel (Signal, phone call, etc.)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PULL TAB ── */}
          {tab === "pull" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="section-label">pull + decrypt env vars</div>

              <div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>token</div>
                <input className="input" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={pullToken} onChange={e => setPullToken(e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>passphrase</div>
                <PassphraseInput value={pullPassphrase} onChange={setPullPassphrase} placeholder="passphrase from sender..." showGenerate={false} />
              </div>

              <button className="btn-primary" onClick={handlePull}
                disabled={pulling || !pullToken.trim() || !pullPassphrase.trim()}
                style={{ alignSelf: "flex-start" }}>
                <Download size={14} />
                {pulling ? "decrypting..." : "pull tunnel"}
              </button>

              {pullError && (
                <div style={{
                  padding: "16px 20px", background: "rgba(255,68,68,0.06)",
                  border: "1px solid rgba(255,68,68,0.3)", color: "var(--danger)", fontSize: 13,
                }}>
                  ✗ {pullError}
                </div>
              )}

              {pullResult && (
                <div style={{ border: "1px solid var(--accent-border)", background: "var(--accent-dim)", padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      ✓ decrypted — token consumed
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <CopyButton text={pullResult} label="copy all" />
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => {
                        const blob = new Blob([pullResult], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = ".env"; a.click();
                      }}>
                        download .env
                      </button>
                    </div>
                  </div>
                  <pre style={{
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    padding: "16px 20px", fontSize: 12, color: "var(--text)",
                    overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
                    fontFamily: "JetBrains Mono, monospace",
                  }}>
                    {pullResult}
                  </pre>
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted2)" }}>
                    ✓ Token consumed after successful decryption. Cannot be pulled again.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 24 }}>
            <div className="section-label" style={{ marginBottom: 16 }}>active tunnels ({tunnels.length})</div>
            {tunnels.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "32px 0", borderTop: "1px solid var(--border)" }}>
                no active tunnels<br />
                <span style={{ fontSize: 11 }}>push one to get started</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tunnels.map(t => (
                  <div key={t.token} style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                      <button onClick={() => setTunnels(prev => prev.filter(x => x.token !== t.token))} style={{
                        background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex",
                      }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 8 }}>
                      {t.token.substring(0, 18)}...
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted2)" }}>
                        <Clock size={10} /><Countdown expiresAt={t.expiresAt} />
                      </div>
                      <CopyButton text={t.token} label="token" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLI hint */}
          <div style={{ marginTop: 16, background: "var(--surface)", border: "1px solid var(--border)", padding: 20 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>cli usage</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="code-block" style={{ padding: "8px 12px", fontSize: 11 }}>
                <span style={{ color: "var(--accent)" }}>$</span> envtunnel push
              </div>
              <div className="code-block" style={{ padding: "8px 12px", fontSize: 11 }}>
                <span style={{ color: "var(--accent)" }}>$</span> envtunnel pull <span style={{ color: "var(--muted2)" }}>[token]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
