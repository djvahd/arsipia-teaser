export const START_SCORE = 12;
export const POINTS = { suggest: 3, duplicate: 4, metadata: 3, checklist: 2 };
export const DEST_OPTIONS = ["Rapat", "Legal", "Keuangan", "Dokumentasi", "Laporan"];

const STATUSES = ["pending", "done", "skipped"];

export function initialState() {
  return {
    queue: [
      { id: "q1", kind: "suggest", title: "Notulen rapat (1).docx", dest: "Rapat", status: "pending" },
      { id: "q2", kind: "suggest", title: "Kontrak vendor (copy).pdf", dest: "Legal", status: "pending" },
      { id: "q3", kind: "suggest", title: "Rekap_biaya_okt_fix.xlsx", dest: "Keuangan", status: "pending" },
      { id: "q4", kind: "suggest", title: "scan0012.jpg", dest: "Dokumentasi", status: "pending" },
      { id: "q5", kind: "suggest", title: "Laporan_FINAL_v7_beneran.docx", dest: "Laporan", status: "pending" },
      { id: "q6", kind: "duplicate", title: "Laporan_FINAL_v7_beneran (1).docx", note: "Isinya sama persis dengan Laporan_FINAL_v7_beneran.docx", status: "pending" },
      { id: "q7", kind: "duplicate", title: "IMG_4471 (copy).jpg", note: "Duplikat dari scan0012.jpg", status: "pending" },
      { id: "q8", kind: "metadata", title: "Perjanjian_vendor_2026.pdf", note: "Tambahkan tag #kontrak agar mudah dicari", status: "pending" },
      { id: "q9", kind: "metadata", title: "Anggaran_proyek_baru.xlsx", note: "Tambahkan tag #anggaran", status: "pending" },
      { id: "q10", kind: "metadata", title: "Panduan_onboarding.docx", note: "Tambahkan tag #onboarding", status: "pending" },
    ],
    checklist: [
      { id: "c1", label: "Daftar akses akun dan Drive diserahkan", done: false },
      { id: "c2", label: "Folder arsip periode lalu ditutup", done: false },
      { id: "c3", label: "Kontak penting diperbarui", done: false },
      { id: "c4", label: "Dokumen kunci diverifikasi ada", done: false },
      { id: "c5", label: "Akses bersama dipindahkan ke penerus", done: false },
      { id: "c6", label: "Sesi serah terima dijadwalkan", done: false },
    ],
  };
}

export function earnedPoints(state) {
  const queue = state.queue.filter((q) => q.status === "done").reduce((sum, q) => sum + POINTS[q.kind], 0);
  const checklist = state.checklist.filter((c) => c.done).length * POINTS.checklist;
  return queue + checklist;
}

function maxPoints(state) {
  const queue = state.queue.reduce((sum, q) => sum + POINTS[q.kind], 0);
  return queue + state.checklist.length * POINTS.checklist;
}

export function scoreOf(state) {
  return Math.round(START_SCORE + (100 - START_SCORE) * (earnedPoints(state) / maxPoints(state)));
}

export function resolveItem(state, id, action) {
  const item = state.queue.find((q) => q.id === id);
  if (!item || item.status !== "pending") return state;
  const status = action === "approve" ? "done" : "skipped";
  return { ...state, queue: state.queue.map((q) => (q.id === id ? { ...q, status } : q)) };
}

export function setDest(state, id, dest) {
  const item = state.queue.find((q) => q.id === id);
  if (!item || item.kind !== "suggest" || item.status !== "pending" || !DEST_OPTIONS.includes(dest)) return state;
  return { ...state, queue: state.queue.map((q) => (q.id === id ? { ...q, dest } : q)) };
}

export function toggleChecklist(state, id) {
  return { ...state, checklist: state.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) };
}

export function exprForScore(score) {
  if (score < 30) return "shock";
  if (score < 70) return "think";
  if (score < 100) return "happy";
  return "celebrate";
}

export function isHandoverComplete(state) {
  return state.checklist.every((c) => c.done);
}

export const BADGES = [
  { id: "arsip-perdana", name: "Arsip Perdana", hint: "Selesaikan satu aksi apa pun", test: (s) => earnedPoints(s) > 0 },
  {
    id: "anti-duplikat",
    name: "Anti Duplikat",
    hint: "Hapus semua file duplikat",
    test: (s) => s.queue.filter((q) => q.kind === "duplicate").every((q) => q.status === "done"),
  },
  { id: "rapi", name: "Rapi 7 Hari", hint: "Capai skor 80 (versi asli: rapi 7 hari berturut-turut)", test: (s) => scoreOf(s) >= 80 },
  { id: "penjaga-warisan", name: "Penjaga Warisan", hint: "Selesaikan seluruh checklist serah terima", test: isHandoverComplete },
];

export function unlockedBadges(state) {
  return BADGES.filter((b) => b.test(state)).map((b) => b.id);
}

export function newBadges(prev, next) {
  const before = new Set(unlockedBadges(prev));
  return unlockedBadges(next).filter((id) => !before.has(id));
}

export function handoverSummary(state, dateLabel, orgName = "Tim Operasional Contoh") {
  const done = state.checklist.filter((c) => c.done).length;
  return `Serah terima terverifikasi: ${done} dari ${state.checklist.length} item selesai (${orgName}, ${dateLabel}).`;
}

export function restore(raw) {
  const base = initialState();
  if (!raw || typeof raw !== "object") return base;

  const savedQueue = new Map((Array.isArray(raw.queue) ? raw.queue : []).map((q) => [q?.id, q]));
  base.queue = base.queue.map((q) => {
    const saved = savedQueue.get(q.id);
    if (!saved) return q;
    const next = { ...q };
    if (STATUSES.includes(saved.status)) next.status = saved.status;
    if (q.kind === "suggest" && DEST_OPTIONS.includes(saved.dest)) next.dest = saved.dest;
    return next;
  });

  const savedChecklist = new Map((Array.isArray(raw.checklist) ? raw.checklist : []).map((c) => [c?.id, c?.done === true]));
  base.checklist = base.checklist.map((c) => ({ ...c, done: savedChecklist.get(c.id) ?? false }));

  return base;
}
