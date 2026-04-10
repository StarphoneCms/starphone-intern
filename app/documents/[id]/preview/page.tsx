// app/documents/[id]/preview/page.tsx
// Zeigt das PDF direkt via <embed> — kein Layout-Problem mehr

export default async function DocumentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#404040" }}>
      {/* Toolbar */}
      <div style={{
        height: 48, background: "white", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
        fontFamily: "Arial, sans-serif", flexShrink: 0,
      }}>
        <a href={`/documents/${id}`} style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>
          ← Zurück
        </a>
        <span style={{ color: "#d1d5db" }}>·</span>
        <span style={{ fontSize: 12, color: "#374151" }}>PDF Vorschau</span>
        <a
          href={`/api/documents/${id}/pdf`}
          download
          style={{
            marginLeft: "auto", background: "#000", color: "white",
            padding: "6px 16px", borderRadius: 8, fontSize: 12,
            textDecoration: "none", fontFamily: "Arial, sans-serif",
          }}
        >
          ⬇ PDF herunterladen
        </a>
      </div>

      {/* PDF eingebettet */}
      <embed
        src={`/api/documents/${id}/pdf`}
        type="application/pdf"
        style={{ flex: 1, width: "100%", border: "none" }}
      />
    </div>
  );
}