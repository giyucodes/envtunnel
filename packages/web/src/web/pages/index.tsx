import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Terminal, Lock, Zap, ArrowRight, Copy, Check } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Push your env",
    desc: "Encrypt locally with a passphrase. Token generated instantly.",
    cmd: "envtunnel push --file .env --label staging",
  },
  {
    num: "02",
    title: "Share the token",
    desc: "Send the token (not the passphrase) over any channel. It dies after first pull.",
    cmd: "→  token: a1b2-c3d4-e5f6  (expires in 10min)",
  },
  {
    num: "03",
    title: "Pull on other side",
    desc: "Teammate runs pull. Vars injected into their shell. Token destroyed.",
    cmd: "envtunnel pull a1b2-c3d4-e5f6",
  },
];

const features = [
  {
    icon: Lock,
    title: "E2E Encrypted",
    desc: "AES-256-GCM. Encrypted before it leaves your machine. Server never sees plaintext.",
  },
  {
    icon: Zap,
    title: "One-time tokens",
    desc: "GETDEL on Redis. Read once and it's gone. No replay attacks.",
  },
  {
    icon: Terminal,
    title: "CLI-first",
    desc: "npx envtunnel push. Zero config, zero setup. Works anywhere.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "transparent",
        border: "1px solid var(--border2)",
        color: "var(--muted2)",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "copied" : "copy"}
    </button>
  );
}

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 40px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(8px)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.02em",
          }}
        >
          <Terminal size={16} color="var(--accent)" />
          <span>envtunnel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a
            href="https://github.com"
            style={{ color: "var(--muted2)", fontSize: 13 }}
          >
            github
          </a>
          <Link to="/dashboard">
            <button className="btn-primary" style={{ padding: "6px 16px" }}>
              dashboard
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="grid-bg"
        style={{
          padding: "100px 40px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 200,
            background: "radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className={visible ? "animate-in" : ""}
          style={{ maxWidth: 700, position: "relative" }}
        >
          <div className="badge badge-green" style={{ marginBottom: 24 }}>
            ● live — open source
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Share .env files
            <br />
            <span style={{ color: "var(--accent)" }}>without dying inside</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--muted2)",
              maxWidth: 500,
              marginBottom: 40,
              lineHeight: 1.7,
            }}
          >
            Encrypted one-time tokens. Share env vars directly from your
            terminal. Token dies after first read. No Slack DMs with secrets
            ever again.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/dashboard">
              <button className="btn-primary">
                open dashboard <ArrowRight size={14} />
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="btn-secondary">how it works</button>
            </a>
          </div>
        </div>

        {/* Install command */}
        <div
          className={`code-block animate-in animate-in-delay-2`}
          style={{
            marginTop: 56,
            maxWidth: 600,
          }}
        >
          <CopyButton text="npx envtunnel push --file .env" />
          <div style={{ color: "var(--muted2)", marginBottom: 4 }}>
            # install globally
          </div>
          <div>
            <span style={{ color: "var(--accent)" }}>$</span>{" "}
            <span style={{ color: "var(--text)" }}>
              npm install -g envtunnel
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: "var(--accent)" }}>$</span>{" "}
            <span style={{ color: "var(--text)" }}>
              envtunnel push --file .env
            </span>
          </div>
          <div style={{ marginTop: 4, color: "var(--muted2)" }}>
            ✓ encrypted &nbsp;→ &nbsp;token:{" "}
            <span style={{ color: "var(--accent)" }}>a1b2c3d4-e5f6...</span>
            &nbsp;(10min)
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="section-label">why envtunnel</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 1,
            marginTop: 24,
            border: "1px solid var(--border)",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "32px 28px",
                background: "var(--surface)",
                borderRight: i < features.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <f.icon size={20} color="var(--accent)" style={{ marginBottom: 16 }} />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                {f.title}
              </div>
              <p style={{ color: "var(--muted2)", lineHeight: 1.7, fontSize: 13 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{
          padding: "80px 40px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="section-label">how it works</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginTop: 24,
          }}
        >
          {steps.map((step, i) => (
            <div key={i} className="card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--accent)",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}
              >
                {step.num}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                }}
              >
                {step.title}
              </div>
              <p
                style={{
                  color: "var(--muted2)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}
              >
                {step.desc}
              </p>
              <div
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "var(--muted2)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                <span style={{ color: "var(--accent)" }}>$ </span>
                {step.cmd}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 40px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          stop sharing secrets over slack
        </h2>
        <p style={{ color: "var(--muted2)", marginBottom: 32, fontSize: 14 }}>
          Takes 30 seconds to set up. Your secrets deserve better.
        </p>
        <Link to="/dashboard">
          <button className="btn-primary">
            open dashboard <ArrowRight size={14} />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--muted)",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Terminal size={12} color="var(--muted)" />
          envtunnel
        </div>
        <div>encrypted. ephemeral. open source.</div>
      </footer>
    </div>
  );
}
