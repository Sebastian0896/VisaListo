import "server-only";
import { Circle, Document, Page, Path, Polygon, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { displayValue, visibleQuestions } from "@/components/shared/answers-view";
import { PRIVATE_MARK } from "@/components/shared/print-document";
import type { FileStatus } from "@/generated/prisma/enums";
import { formatDateTime, formatIsoDay } from "@/lib/format";
import { isAnswered, type AnswerMap, type ClientQuestion, type ClientSection, type GroupRow } from "@/lib/form-types";
import { STATUS_LABELS } from "@/lib/status";

const NAVY = "#1e2f5c";
const s = StyleSheet.create({
  page: { paddingTop: 64, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#1f2433" },
  mark: { position: "absolute", top: 20, left: 40, right: 40, borderWidth: 1, borderColor: "#e3a5ad", backgroundColor: "#fdf1f2", color: "#8a1c2b", fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "center", paddingVertical: 4, paddingHorizontal: 6 },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: "#6b7280", borderTopWidth: 0.5, borderTopColor: "#d1d5db", paddingTop: 6 },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", color: NAVY },
  subtitle: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, marginBottom: 8, borderWidth: 0.5, borderColor: "#d1d5db", borderRadius: 4, padding: 8 },
  metaItem: { width: "33%", marginBottom: 4 },
  metaLabel: { fontSize: 7.5, color: "#6b7280" },
  metaValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 14, marginBottom: 4, paddingBottom: 3, borderBottomWidth: 1.2, borderBottomColor: "#c9d2e8" },
  row: { flexDirection: "row", paddingVertical: 3.5, borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  q: { width: "42%", color: "#4b5563", paddingRight: 8 },
  a: { width: "58%", fontFamily: "Helvetica-Bold" },
  pending: { color: "#92400e", fontFamily: "Helvetica-Oblique" },
  empty: { color: "#9ca3af", fontFamily: "Helvetica" },
  groupRow: { marginBottom: 2 },
  notes: { marginTop: 18, borderWidth: 1, borderStyle: "dashed", borderColor: "#d97706", padding: 8 },
});

function groupLine(q: ClientQuestion, row: GroupRow) {
  return (q.config.fields ?? [])
    .filter((f) => row[f.key])
    .map((f) => {
      let v = row[f.key];
      if (f.type === "YESNO") v = v === "yes" ? "Sí" : v === "no" ? "No" : v;
      else if (f.type === "SELECT") v = f.options?.find((o) => o.value === v)?.label ?? v;
      else if (f.type === "DATE") v = formatIsoDay(v);
      return `${f.label}: ${v}`;
    })
    .join("  ·  ");
}

export type PdfInput = {
  platformName: string;
  code: string;
  status: FileStatus;
  applicantName: string;
  createdAt: Date;
  submittedAt: Date | null;
  percent: number;
  sections: ClientSection[];
  answers: AnswerMap;
  size: "LETTER" | "A4";
  internalNotes?: { body: string; author: string; createdAt: Date }[];
};

function PdfDoc(p: PdfInput) {
  const generated = formatDateTime(new Date());
  return (
    <Document title={`Preparación ${p.code}`} author={p.platformName} subject="Documento privado de preparación" creator={p.platformName}>
      <Page size={p.size} style={s.page} wrap>
        <Text style={s.mark} fixed>{PRIVATE_MARK}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Svg viewBox="-33 -30 64 64" style={{ width: 34, height: 34, marginRight: 10 }}>
            <Path d="M-30 30 q4 -12 14 -16" fill="none" stroke="#2bc4b1" strokeWidth={3.5} strokeLinecap="round" strokeDasharray="1 7" />
            <Polygon points="28,-28 -26,4 -4,4" fill="#1e2f5c" />
            <Polygon points="28,-28 -4,4 -4,26" fill="#14998a" />
            <Circle cx={-4} cy={4} r={4} fill="#ffffff" stroke="#1e2f5c" strokeWidth={2} />
          </Svg>
          <View>
            <Text style={s.title}>Formulario de preparación</Text>
            <Text style={s.subtitle}>{p.platformName}  ·  {p.applicantName}</Text>
          </View>
        </View>
        <View style={s.meta}>
          {[
            ["Expediente", p.code],
            ["Estado", STATUS_LABELS[p.status]],
            ["Completado", `${p.percent}%`],
            ["Creado", formatDateTime(p.createdAt)],
            ["Enviado", formatDateTime(p.submittedAt)],
            ["Generado", generated],
          ].map(([k, v]) => (
            <View key={k} style={s.metaItem}>
              <Text style={s.metaLabel}>{k}</Text>
              <Text style={s.metaValue}>{v}</Text>
            </View>
          ))}
        </View>

        {p.sections.map((sec) => (
          <View key={sec.key}>
            <Text style={s.sectionTitle} minPresenceAhead={40}>{sec.order}. {sec.title}</Text>
            {visibleQuestions(sec, p.answers).map((q) => {
              const v = p.answers[q.key];
              const answered = isAnswered(q, v);
              return (
                <View key={q.key} style={s.row} wrap={false}>
                  <Text style={s.q}>{q.label}</Text>
                  <View style={s.a}>
                    {q.type === "GROUP" && Array.isArray(v) && v.length ? (
                      v.map((row, i) => <Text key={i} style={s.groupRow}>{i + 1}. {groupLine(q, row)}</Text>)
                    ) : typeof v === "string" && v ? (
                      <Text>{displayValue(q, v)}</Text>
                    ) : q.required && !answered ? (
                      <Text style={s.pending}>Pendiente</Text>
                    ) : (
                      <Text style={s.empty}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {p.internalNotes && p.internalNotes.length > 0 && (
          <View style={s.notes}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Notas internas del asesor — USO INTERNO, NO ENTREGAR AL CLIENTE</Text>
            {p.internalNotes.map((n, i) => (
              <Text key={i} style={{ marginBottom: 4 }}>{n.body}  ({n.author}, {formatDateTime(n.createdAt)})</Text>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{p.code}  ·  Generado {generated}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function renderPreparationPdf(input: PdfInput) {
  return renderToBuffer(<PdfDoc {...input} />);
}
