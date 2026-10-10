export const DEFAULT_CONTEXT = "kantor";

export const CONTEXTS = {
  kantor: {
    label: "Kantor",
    terms: { team: "tim", period: "tahun", successor: "rekan baru" },
    files: [
      { name: "Laporan_FINAL_v7_beneran.docx", ext: "doc", dest: "Laporan" },
      { name: "Kontrak vendor (copy).pdf", ext: "pdf", dest: "Legal" },
      { name: "Notulen rapat (1).docx", ext: "doc", dest: "Rapat" },
      { name: "scan0012.jpg", ext: "img", dest: "Dokumentasi" },
      { name: "Rekap_biaya_okt_fix.xlsx", ext: "xls", dest: "Keuangan" },
      { name: "Invoice_catering-2.pdf", ext: "pdf", dest: "Keuangan" },
    ],
  },
  startup: {
    label: "Startup",
    terms: { team: "tim", period: "kuartal", successor: "anggota baru" },
    files: [
      { name: "Pitch_deck_v12_FINAL.pdf", ext: "pdf", dest: "Investor" },
      { name: "Roadmap_Q3_revisi.docx", ext: "doc", dest: "Produk" },
      { name: "Cap table (copy).xlsx", ext: "xls", dest: "Keuangan" },
      { name: "Perjanjian freelancer.pdf", ext: "pdf", dest: "Legal" },
      { name: "Notulen sprint planning (1).docx", ext: "doc", dest: "Tim" },
      { name: "Spesifikasi fitur_baru.docx", ext: "doc", dest: "Produk" },
    ],
  },
  komunitas: {
    label: "Komunitas",
    terms: { team: "komunitas", period: "periode", successor: "pengurus baru" },
    files: [
      { name: "Rundown_meetup_FINAL2.docx", ext: "doc", dest: "Acara" },
      { name: "Daftar anggota (copy).xlsx", ext: "xls", dest: "Anggota" },
      { name: "Proposal sponsor_v3.pdf", ext: "pdf", dest: "Sponsor" },
      { name: "foto kopdar (1).jpg", ext: "img", dest: "Dokumentasi" },
      { name: "Kas komunitas okt.xlsx", ext: "xls", dest: "Keuangan" },
      { name: "Poster_acara_baru.jpg", ext: "img", dest: "Acara" },
    ],
  },
  kampus: {
    label: "Kampus",
    terms: { team: "organisasi", period: "kepengurusan", successor: "pengurus baru" },
    files: [
      { name: "LPJ_FINAL_revisi3_beneran.docx", ext: "doc", dest: "LPJ" },
      { name: "Proposal sponsor - copy.pdf", ext: "pdf", dest: "Proposal" },
      { name: "Matriks sponsor 2025.xlsx", ext: "xls", dest: "Sponsor" },
      { name: "scan0012.jpg", ext: "img", dest: "Dokumentasi" },
      { name: "Kontak pembicara.xlsx", ext: "xls", dest: "Kontak" },
      { name: "Script acara hari-H.docx", ext: "doc", dest: "Proposal" },
    ],
  },
};
