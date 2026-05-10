#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createInterface } from "readline";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import ora from "ora";
import { encrypt, decrypt } from "./crypto.js";
import { pushTunnel, pullTunnel, consumeTunnel, peekTunnel, getApiBase, type RedisOpts } from "./api.js";

const program = new Command();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function handler(ch) {
        const c = ch.toString();
        if (c === "\n" || c === "\r" || c === "\u0003") {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (c === "\u007f") {
          input = input.slice(0, -1);
        } else {
          input += c;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(question, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

function formatTTL(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function printBanner() {
  console.log(
    chalk.green("\n  ███████╗███╗   ██╗██╗   ██╗████████╗██╗   ██╗███╗   ██╗██╗") +
    chalk.green("\n  ██╔════╝████╗  ██║██║   ██║╚══██╔══╝██║   ██║████╗  ██║██║") +
    chalk.green("\n  █████╗  ██╔██╗ ██║██║   ██║   ██║   ██║   ██║██╔██╗ ██║██║") +
    chalk.green("\n  ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝   ██║   ██║   ██║██║╚██╗██║██║") +
    chalk.green("\n  ███████╗██║ ╚████║ ╚████╔╝    ██║   ╚██████╔╝██║ ╚████║███████╗") +
    chalk.green("\n  ╚══════╝╚═╝  ╚═══╝  ╚═══╝     ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝\n")
  );
  console.log(chalk.dim("  encrypted one-time env sharing\n"));
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

program
  .name("envtunnel")
  .description("Securely share .env files via encrypted one-time tokens")
  .version("1.0.0");

// ─── PUSH ────────────────────────────────────────────────────────────────────
program
  .command("push")
  .description("Encrypt and push env vars, get a one-time token")
  .option("-f, --file <path>", "Path to .env file (default: .env)")
  .option("-l, --label <label>", "Label for this tunnel")
  .option("-e, --env <vars>", "Comma-separated env var names to include from shell")
  .option("--api <url>", "Custom API base URL")
  .option("--redis-url <url>", "Custom Upstash Redis REST URL")
  .option("--redis-token <token>", "Custom Upstash Redis REST token")
  .action(async (opts) => {
    printBanner();

    const apiBase = opts.api ?? getApiBase();
    const redis: RedisOpts = { redisUrl: opts.redisUrl, redisToken: opts.redisToken };
    let envContent = "";

    // Load from file
    if (opts.file || !opts.env) {
      const filePath = resolve(process.cwd(), opts.file ?? ".env");
      if (!existsSync(filePath)) {
        console.error(chalk.red(`✗ File not found: ${filePath}`));
        process.exit(1);
      }
      envContent = readFileSync(filePath, "utf8").trim();
      console.log(chalk.dim(`  source  : ${filePath}`));
    }

    // Load from shell env vars
    if (opts.env) {
      const keys = opts.env.split(",").map((k: string) => k.trim());
      const lines = keys
        .map((k: string) => {
          const val = process.env[k];
          if (!val) {
            console.warn(chalk.yellow(`  ⚠ ${k} not found in shell env, skipping`));
            return null;
          }
          return `${k}=${val}`;
        })
        .filter(Boolean);
      envContent = lines.join("\n");
    }

    if (!envContent) {
      console.error(chalk.red("✗ No env vars to push"));
      process.exit(1);
    }

    const varCount = envContent.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
    console.log(chalk.dim(`  vars    : ${varCount} found\n`));

    // Label
    const labelInput = opts.label ?? (await ask(chalk.dim("  label (optional, press enter to skip): ")));
    const label = labelInput || "untitled";

    // Passphrase
    console.log(chalk.dim("  ────────────────────────────────────────────"));
    console.log(chalk.yellow("  ⚠  Share this passphrase via Signal/phone — NOT with the token"));
    console.log(chalk.dim("  ────────────────────────────────────────────\n"));
    const passphrase = await ask(chalk.white("  passphrase: "), true);

    if (!passphrase) {
      console.error(chalk.red("\n✗ Passphrase cannot be empty"));
      process.exit(1);
    }

    const confirmPass = await ask(chalk.white("  confirm passphrase: "), true);
    if (passphrase !== confirmPass) {
      console.error(chalk.red("\n✗ Passphrases don't match"));
      process.exit(1);
    }

    console.log();
    const spinner = ora({ text: "Encrypting...", color: "green" }).start();

    try {
      const { payload, iv } = encrypt(envContent, passphrase);
      spinner.text = "Pushing to server...";

      const result = await pushTunnel(payload, iv, label, apiBase, redis);
      spinner.succeed(chalk.green("Tunnel created!"));

      const ttl = formatTTL(result.expiresIn);

      console.log("\n" + chalk.green("  ┌─────────────────────────────────────────────┐"));
      console.log(chalk.green("  │") + chalk.white("  TOKEN (share this)                          ") + chalk.green("│"));
      console.log(chalk.green("  │") + "  " + chalk.greenBright.bold(result.token) + "  " + chalk.green("│"));
      console.log(chalk.green("  └─────────────────────────────────────────────┘"));

      console.log(chalk.dim(`\n  label   : ${result.label}`));
      console.log(chalk.dim(`  expires : ${ttl}`));
      console.log(chalk.dim(`  uses    : 1 (destroyed on pull)\n`));

      console.log(chalk.dim("  pull command:"));
      console.log(chalk.white(`  envtunnel pull ${result.token}\n`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Push failed: ${err.message}`));
      process.exit(1);
    }
  });

// ─── PULL ────────────────────────────────────────────────────────────────────
program
  .command("pull <token>")
  .description("Pull and decrypt env vars using a one-time token")
  .option("-o, --output <path>", "Write decrypted vars to a file (e.g. .env)")
  .option("--export", "Print as export statements for shell eval")
  .option("--api <url>", "Custom API base URL")
  .option("--redis-url <url>", "Custom Upstash Redis REST URL")
  .option("--redis-token <token>", "Custom Upstash Redis REST token")
  .action(async (token: string, opts) => {
    printBanner();

    const apiBase = opts.api ?? getApiBase();
    const redis: RedisOpts = { redisUrl: opts.redisUrl, redisToken: opts.redisToken };

    // Peek first
    const spinner = ora({ text: "Checking token...", color: "green" }).start();
    try {
      const peek = await peekTunnel(token, apiBase, redis);
      if (!peek.exists) {
        spinner.fail(chalk.red("Token not found or already used"));
        process.exit(1);
      }
      spinner.succeed(
        chalk.green(`Token valid`) +
          chalk.dim(` — "${peek.label}" — ${formatTTL(peek.ttl!)} remaining`)
      );
    } catch (err: any) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }

    console.log();
    const passphrase = await ask(chalk.white("  passphrase: "), true);
    if (!passphrase) {
      console.error(chalk.red("\n✗ Passphrase cannot be empty"));
      process.exit(1);
    }

    console.log();
    const spinner2 = ora({ text: "Pulling...", color: "green" }).start();

    try {
      const data = await pullTunnel(token, apiBase, redis);
      spinner2.text = "Decrypting...";

      // Decrypt first — if wrong passphrase this throws and token survives
      const decrypted = decrypt(data.payload, data.iv, passphrase);

      // Only consume token after successful decryption
      await consumeTunnel(token, apiBase, redis);
      spinner2.succeed(chalk.green("Decrypted successfully — token consumed"));

      const varCount = decrypted.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
      console.log(chalk.dim(`\n  vars    : ${varCount}\n`));

      if (opts.output) {
        const outPath = resolve(process.cwd(), opts.output);
        writeFileSync(outPath, decrypted + "\n", "utf8");
        console.log(chalk.green(`  ✓ Written to ${outPath}\n`));
      } else if (opts.export) {
        // Print as export statements
        console.log(chalk.dim("  # paste this in your terminal:\n"));
        decrypted.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            console.log(`  export ${trimmed}`);
          }
        });
        console.log();
      } else {
        // Default: print the vars
        console.log(chalk.dim("  ─────────────────────────────────────────────"));
        decrypted.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            console.log(chalk.dim(`  ${trimmed}`));
          } else {
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > -1) {
              const key = trimmed.slice(0, eqIdx);
              const val = trimmed.slice(eqIdx + 1);
              console.log(
                "  " + chalk.green(key) + chalk.dim("=") + chalk.white(val)
              );
            } else {
              console.log("  " + trimmed);
            }
          }
        });
        console.log(chalk.dim("  ─────────────────────────────────────────────\n"));

        console.log(chalk.dim("  to save to file:"));
        console.log(chalk.white(`  envtunnel pull ${token} -o .env\n`));
        console.log(chalk.dim("  to export to shell:"));
        console.log(chalk.white(`  eval $(envtunnel pull ${token} --export)\n`));
      }
    } catch (err: any) {
      spinner2.fail(
        err.message?.includes("bad decrypt") || err.message?.includes("Unsupported state")
          ? chalk.red("Wrong passphrase — decryption failed")
          : chalk.red(err.message)
      );
      process.exit(1);
    }
  });

// ─── PEEK ────────────────────────────────────────────────────────────────────
program
  .command("peek <token>")
  .description("Check if a token is still valid (non-destructive)")
  .option("--api <url>", "Custom API base URL")
  .option("--redis-url <url>", "Custom Upstash Redis REST URL")
  .option("--redis-token <token>", "Custom Upstash Redis REST token")
  .action(async (token: string, opts) => {
    const apiBase = opts.api ?? getApiBase();
    const redis: RedisOpts = { redisUrl: opts.redisUrl, redisToken: opts.redisToken };
    const spinner = ora({ text: "Checking token...", color: "green" }).start();

    try {
      const data = await peekTunnel(token, apiBase, redis);
      if (!data.exists) {
        spinner.fail(chalk.red("Token not found or already used"));
      } else {
        spinner.succeed(
          chalk.green("Token valid") +
            chalk.dim(` — "${data.label}" — ${formatTTL(data.ttl!)} remaining`)
        );
      }
    } catch (err: any) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }
  });

program.parse();
