// lib/pdf/StarphoneDocument.tsx
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer";
import { STARPHONE_LOGO } from "./logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocItem = {
  position: number;
  description: string;
  details?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount?: number;
  discount_type?: string;
  total: number;
  total_netto?: number;
  tax_amount?: number;
  tax_rate?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = { doc: any; items: any[]; company: any };

const r2 = (n: number) => Math.round(n * 100) / 100;

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222",
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 45,
    flexDirection: "column",
  },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  senderMini: { fontSize: 7, color: "#888", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingBottom: 3, marginBottom: 8 },
  recipientName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 1 },
  recipientText: { fontSize: 9, color: "#333", marginBottom: 1 },
  recipientSub: { fontSize: 8, color: "#666" },

  companyBlock: { alignItems: "flex-end" },
  logo: { width: 160, height: 40, objectFit: "contain" },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  companyText: { fontSize: 8, color: "#555", textAlign: "right", marginBottom: 1 },
  companyTax: { fontSize: 7, color: "#999", textAlign: "right", marginBottom: 1 },

  // Title
  titleBlock: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  titleText: { fontSize: 16, fontFamily: "Helvetica-Bold", marginRight: 8 },
  titleNum: { fontSize: 11, color: "#666" },
  metaRow: { flexDirection: "row", gap: 16 },
  metaLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#333" },
  metaValue: { fontSize: 8, color: "#555" },

  // Header note
  headerNote: { fontSize: 8.5, color: "#555", marginBottom: 10, lineHeight: 1.4 },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderTopWidth: 0.5, borderTopColor: "#999",
    borderBottomWidth: 0.5, borderBottomColor: "#999",
    paddingVertical: 4,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.3, borderBottomColor: "#ddd",
    paddingVertical: 5,
  },
  tableLastRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5, borderBottomColor: "#999",
    paddingVertical: 5,
  },
  colPos:    { width: 20, fontSize: 8 },
  colDesc:   { flex: 1, paddingRight: 6 },
  colMenge:  { width: 32, textAlign: "right" },
  colEinheit:{ width: 28, paddingLeft: 4 },
  colPreis:  { width: 48, textAlign: "right" },
  colRabatt: { width: 36, textAlign: "right" },
  colGesamt: { width: 48, textAlign: "right" },
  thText:    { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#333" },
  tdText:    { fontSize: 8.5, color: "#333" },
  tdBold:    { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  tdGray:    { fontSize: 8, color: "#888" },
  tdGreen:   { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#15803d" },
  descDetail:{ fontSize: 7.5, color: "#888", marginTop: 1 },

  // Summen
  sumBlock: { alignItems: "flex-end", marginTop: 8, marginBottom: 12 },
  sumInner: { width: 200 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  sumLabel: { fontSize: 8.5, color: "#555" },
  sumValue: { fontSize: 8.5, color: "#333", fontFamily: "Helvetica" },
  sumRabattLabel: { fontSize: 8.5, color: "#15803d", fontFamily: "Helvetica-Bold" },
  sumRabattValue: { fontSize: 8.5, color: "#15803d", fontFamily: "Helvetica-Bold" },
  sumDivider: { borderTopWidth: 0.3, borderTopColor: "#ccc", marginVertical: 2 },
  sumTotalDivider: { borderTopWidth: 1, borderTopColor: "#222", marginVertical: 3 },
  sumTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#000" },
  sumTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#000" },
  sumExplain: { fontSize: 7, color: "#999", marginTop: 3, textAlign: "right" },

  // Footer note
  footerNote: {
    fontSize: 8.5, color: "#555", lineHeight: 1.4,
    borderTopWidth: 0.3, borderTopColor: "#ddd",
    paddingTop: 6, marginBottom: 8,
  },

  // Page footer
  pageFooter: {
    position: "absolute",
    bottom: 18, left: 45, right: 45,
    borderTopWidth: 0.3, borderTopColor: "#ccc",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCol: { flex: 1 },
  footerColRight: { flex: 1, alignItems: "flex-end" },
  footerText: { fontSize: 7, color: "#888", marginBottom: 1 },
  footerBold: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#666", marginBottom: 1 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function StarphoneDocument({ doc, items, company }: Props) {
  const companyName  = company.company_name  ?? "Starphone";
  const street       = company.address_line1 ?? "";
  const city         = [company.zip_code, company.city].filter(Boolean).join(" ");
  const taxId        = company.tax_number    ?? "";
  const vatId        = company.ust_id        ?? "";
  const bankName     = company.bank_name     ?? "";
  const iban         = company.iban          ?? "";
  const bic          = company.bic           ?? "";
  const email        = company.email         ?? "";
  const phone        = company.phone         ?? "";
  const website      = company.website       ?? "";
  const logoUrl = STARPHONE_LOGO;

  const docItems = (items ?? []) as DocItem[];

  const totalBrutto = Number(doc.total     ?? 0);
  const totalNetto  = Number(doc.subtotal  ?? 0);
  const totalMwst   = Number(doc.tax_amount ?? 0);
  const taxRatePct  = Number(doc.tax_rate   ?? 19);

  const totalRabatt = docItems.reduce((s, i) => {
    if (!i.discount) return s;
    const b = r2(i.quantity * i.unit_price);
    return s + (i.discount_type === "percent" ? r2(b * i.discount / 100) : i.discount);
  }, 0);
  const hasRabatt = totalRabatt > 0;

  // Typ-Label
  const typeLabels: Record<string, string> = {
    angebot: "Angebot", kostenvoranschlag: "Kostenvoranschlag",
    lieferschein: "Lieferschein", rechnung: "Rechnung",
  };
  const isLieferschein = doc.doc_type === "lieferschein";
  const typeLabel = typeLabels[doc.doc_type] ?? doc.doc_type;

  return (
    <Document title={`${typeLabel} ${doc.doc_number}`} author={companyName} creator="Starphone CMS">
      <Page size="A4" style={s.page}>

        {/* ── Logo oben rechts — viel Luft ───────────────────────────── */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 30 }}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logo} />
            : <Text style={s.companyName}>{companyName}</Text>
          }
        </View>

        {/* ── Empfänger links + Firma rechts ─────────────────────────── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>

          {/* Links: DIN 5008 Empfängerfenster */}
          <View style={{ width: "55%" }}>
            <Text style={s.senderMini}>{companyName} · {street} · {city}</Text>
            <View style={{ marginTop: 8 }}>
              {doc.customer_name    && <Text style={s.recipientName}>{doc.customer_name}</Text>}
              {doc.customer_address && <Text style={s.recipientText}>{doc.customer_address}</Text>}
              {doc.customer_email   && <Text style={s.recipientSub}>{doc.customer_email}</Text>}
              {doc.customer_phone   && <Text style={s.recipientSub}>{doc.customer_phone}</Text>}
              {doc.customer_tax_id  && <Text style={[s.recipientSub, { marginTop: 3, fontSize: 7 }]}>USt-IdNr.: {doc.customer_tax_id}</Text>}
            </View>
          </View>

          {/* Rechts: Firmenkontakt */}
          <View style={[s.companyBlock, { width: "38%" }]}>
            <Text style={[s.companyText, { fontFamily: "Helvetica-Bold", color: "#222", marginBottom: 3 }]}>{companyName}</Text>
            {street  && <Text style={s.companyText}>{street}</Text>}
            {city    && <Text style={s.companyText}>{city}</Text>}
            {phone   && <Text style={[s.companyText, { marginTop: 5 }]}>{phone}</Text>}
            {email   && <Text style={s.companyText}>{email}</Text>}
            {website && <Text style={s.companyText}>{website}</Text>}
            {taxId   && <Text style={[s.companyTax, { marginTop: 5 }]}>Steuernr.: {taxId}</Text>}
            {vatId   && <Text style={s.companyTax}>USt-IdNr.: {vatId}</Text>}
          </View>
        </View>

        {/* ── Trennlinie ─────────────────────────────────────────────── */}
        <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#999", marginBottom: 14 }} />

        {/* ── Dokumenttitel ──────────────────────────────────────────── */}
        <View style={s.titleBlock}>
          <View style={s.titleRow}>
            <Text style={s.titleText}>{typeLabel}</Text>
            <Text style={s.titleNum}>{doc.doc_number}</Text>
          </View>
          <View style={s.metaRow}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Text style={s.metaLabel}>Datum:</Text>
              <Text style={s.metaValue}>{fmtDate(doc.doc_date)}</Text>
            </View>
            {doc.valid_until && (
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={s.metaLabel}>Gültig bis:</Text>
                <Text style={s.metaValue}>{fmtDate(doc.valid_until)}</Text>
              </View>
            )}
            {doc.due_date && (
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={s.metaLabel}>Zahlungsziel:</Text>
                <Text style={s.metaValue}>{fmtDate(doc.due_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Kopftext ───────────────────────────────────────────────── */}
        {doc.header_note && <Text style={s.headerNote}>{doc.header_note}</Text>}

        {/* ── Positionen ─────────────────────────────────────────────── */}
        {/* Table Header */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colPos]}>Pos.</Text>
          <Text style={[s.thText, s.colDesc]}>Beschreibung</Text>
          <Text style={[s.thText, s.colMenge]}>Menge</Text>
          <Text style={[s.thText, s.colEinheit]}>Einh.</Text>
          {!isLieferschein && <Text style={[s.thText, s.colPreis]}>Einzelpreis</Text>}
          {!isLieferschein && hasRabatt && <Text style={[s.thText, s.colRabatt]}>Rabatt</Text>}
          {!isLieferschein && <Text style={[s.thText, s.colGesamt]}>Gesamt</Text>}
        </View>

        {/* Table Rows */}
        {docItems.map((item, idx) => {
          const disc      = item.discount ?? 0;
          const discType  = item.discount_type ?? "percent";
          const brutto    = r2(item.quantity * item.unit_price);
          const rabattAmt = disc > 0 ? (discType === "percent" ? r2(brutto * disc / 100) : disc) : 0;
          const isLast    = idx === docItems.length - 1;
          return (
            <View key={idx} style={isLast ? s.tableLastRow : s.tableRow}>
              <Text style={[s.tdGray, s.colPos]}>{item.position}</Text>
              <View style={s.colDesc}>
                <Text style={s.tdBold}>{item.description}</Text>
                {item.details && <Text style={s.descDetail}>{item.details}</Text>}
              </View>
              <Text style={[s.tdText, s.colMenge]}>{item.quantity}</Text>
              <Text style={[s.tdGray, s.colEinheit]}>{item.unit}</Text>
              {!isLieferschein && <Text style={[s.tdText, s.colPreis]}>{money(item.unit_price)}</Text>}
              {!isLieferschein && hasRabatt && (
                <Text style={[s.tdGreen, s.colRabatt]}>
                  {rabattAmt > 0 ? `-${discType === "percent" ? disc + "%" : money(disc)}` : "—"}
                </Text>
              )}
              {!isLieferschein && <Text style={[s.tdBold, s.colGesamt]}>{money(item.total)}</Text>}
            </View>
          );
        })}

        {/* ── Summen (nicht bei Lieferschein) ────────────────────────── */}
        {!isLieferschein && <View style={s.sumBlock}>
          <View style={s.sumInner}>
            {hasRabatt && (
              <>
                <View style={s.sumRow}>
                  <Text style={s.sumLabel}>Zwischensumme</Text>
                  <Text style={s.sumValue}>{money(r2(totalBrutto + totalRabatt))}</Text>
                </View>
                <View style={s.sumRow}>
                  <Text style={s.sumRabattLabel}>Rabatt</Text>
                  <Text style={s.sumRabattValue}>-{money(totalRabatt)}</Text>
                </View>
                <View style={s.sumDivider} />
              </>
            )}
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Nettobetrag</Text>
              <Text style={s.sumValue}>{money(totalNetto)}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>MwSt. {taxRatePct}%</Text>
              <Text style={s.sumValue}>{money(totalMwst)}</Text>
            </View>
            <View style={s.sumTotalDivider} />
            <View style={s.sumRow}>
              <Text style={s.sumTotalLabel}>Gesamtbetrag</Text>
              <Text style={s.sumTotalValue}>{money(totalBrutto)}</Text>
            </View>
            <Text style={s.sumExplain}>
              Im Gesamtbetrag von {money(totalBrutto)} (Netto: {money(totalNetto)}) sind{"\n"}
              USt {taxRatePct}% ({money(totalMwst)}) enthalten.
            </Text>
          </View>
        </View>}

        {/* ── Fußtext ────────────────────────────────────────────────── */}
        {doc.footer_note && <Text style={s.footerNote}>{doc.footer_note}</Text>}

        {/* ── Seitenfooter (absolut unten) ───────────────────────────── */}
        <View style={s.pageFooter} fixed>
          <View style={s.footerCol}>
            <Text style={s.footerBold}>{companyName}</Text>
            {street  && <Text style={s.footerText}>{street}</Text>}
            {city    && <Text style={s.footerText}>{city}</Text>}
            {phone   && <Text style={s.footerText}>{phone}</Text>}
            {email   && <Text style={s.footerText}>{email}</Text>}
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            {vatId && <Text style={s.footerText}>USt-IdNr.: {vatId}</Text>}
            {taxId && <Text style={s.footerText}>Steuernr.: {taxId}</Text>}
          </View>
          <View style={s.footerColRight}>
            {bankName && <Text style={s.footerBold}>{bankName}</Text>}
            {iban     && <Text style={s.footerText}>IBAN: {iban}</Text>}
            {bic      && <Text style={s.footerText}>BIC: {bic}</Text>}
          </View>
        </View>

      </Page>
    </Document>
  );
}