// Pfad: src/app/api/print/route.ts
// Cross-platform: kein lp-Befehl, direkt über TCP/IP Port 9100 zum Drucker
// Funktioniert auf macOS, Windows und Linux

import { NextRequest, NextResponse } from "next/server";
import * as net from "net";

// ─── Drucker-Konfiguration ────────────────────────────────────────────────────
// Drucker müssen eine feste IP haben oder per Hostname erreichbar sein.
// Im Netzwerk: Drucker → Einstellungen → Netzwerk → IP-Adresse ablesen.
// Alternativ: Druckername als Hostname wenn DNS auflösbar.

const PRINTER_CONFIG: Record<string, { host: string; port: number }> = {
  // Hier die IPs deiner Drucker eintragen:
  "Bixolon_SLP-TX223": { host: "192.168.1.100", port: 9100 },  // ← IP anpassen!
  "Bixolon_SLP-TX403": { host: "192.168.1.101", port: 9100 },  // ← IP anpassen!
  // Fallback – falls Drucker per Hostname erreichbar:
  "BIXOLON_SLP-TX223": { host: "192.168.1.100", port: 9100 },
  "BIXOLON_SLP-TX403": { host: "192.168.1.101", port: 9100 },
};

// ─── TCP Print Funktion ───────────────────────────────────────────────────────

function printViaTCP(host: string, port: number, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = 5000; // 5 Sekunden Timeout

    client.setTimeout(timeout);

    client.connect(port, host, () => {
      client.write(data, "utf8", () => {
        client.end();
      });
    });

    client.on("close", () => resolve());

    client.on("timeout", () => {
      client.destroy();
      reject(new Error(`Timeout: Drucker nicht erreichbar unter ${host}:${port}`));
    });

    client.on("error", (err) => {
      client.destroy();
      reject(new Error(`Verbindungsfehler zu ${host}:${port} – ${err.message}`));
    });
  });
}

// ─── GET – Drucker-Status prüfen ──────────────────────────────────────────────

export async function GET() {
  const printers = Object.entries(PRINTER_CONFIG).map(([name, cfg]) => ({
    name,
    host: cfg.host,
    port: cfg.port,
  }));

  // Prüfe welche Drucker erreichbar sind
  const results = await Promise.allSettled(
    Object.entries(PRINTER_CONFIG).map(async ([name, cfg]) => {
      await new Promise<void>((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(2000);
        client.connect(cfg.port, cfg.host, () => { client.end(); resolve(); });
        client.on("timeout", () => { client.destroy(); reject(); });
        client.on("error", () => { client.destroy(); reject(); });
      });
      return name;
    })
  );

  const online = results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<string>).value);

  return NextResponse.json({
    ok: true,
    printers: online,
    all: printers,
    method: "tcp",
  });
}

// ─── POST – Drucken ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { printerName, data } = body as { printerName: string; data: string };

    if (!printerName || !data) {
      return NextResponse.json(
        { ok: false, error: "printerName und data sind Pflichtfelder" },
        { status: 400 }
      );
    }

    // Drucker-Konfiguration nachschlagen
    const printerCfg = PRINTER_CONFIG[printerName];

    if (!printerCfg) {
      // Alle bekannten Drucker zurückgeben
      return NextResponse.json({
        ok: false,
        error: `Drucker "${printerName}" nicht konfiguriert. Bekannte Drucker: ${Object.keys(PRINTER_CONFIG).join(", ")}`,
        knownPrinters: Object.keys(PRINTER_CONFIG),
      }, { status: 404 });
    }

    await printViaTCP(printerCfg.host, printerCfg.port, data);

    return NextResponse.json({
      ok: true,
      message: `Druckauftrag gesendet an ${printerName} (${printerCfg.host}:${printerCfg.port})`,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Print API Fehler:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}