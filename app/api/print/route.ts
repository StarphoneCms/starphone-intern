import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { printerName, data, dataType } = await req.json();

    if (!printerName || !data) {
      return NextResponse.json(
        { ok: false, error: "printerName und data sind erforderlich" },
        { status: 400 }
      );
    }

    // ZPL als temporäre Datei speichern
    const tmpFile = join(tmpdir(), `starphone_label_${Date.now()}.zpl`);
    await writeFile(tmpFile, data, "utf-8");

    // Via CUPS drucken (lp Befehl auf macOS)
    // -d = Druckername, -o raw = rohe Daten (ZPL direkt)
    const { stdout, stderr } = await execAsync(
      `lp -d "${printerName}" -o raw "${tmpFile}"`
    );

    // Temp-Datei aufräumen
    await unlink(tmpFile).catch(() => {});

    if (stderr && !stdout) {
      return NextResponse.json(
        { ok: false, error: stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: stdout.trim() });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Druckfehler" },
      { status: 500 }
    );
  }
}

// Drucker-Status prüfen
export async function GET() {
  try {
    const { stdout } = await execAsync("lpstat -p 2>/dev/null || echo 'keine_drucker'");
    const printers = stdout
      .split("\n")
      .filter((line) => line.startsWith("printer "))
      .map((line) => {
        const match = line.match(/^printer (\S+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, printers });
  } catch {
    return NextResponse.json({ ok: false, printers: [] });
  }
}