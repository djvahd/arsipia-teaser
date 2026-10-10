import { flightPath } from "./pet-motion.js";

// Sisa waktu agar splash tampil minimal `minMs` sejak halaman mulai dimuat. Halaman yang sudah
// lebih lama dari itu tidak ditahan sama sekali.
export function remainingWait(elapsedMs, minMs = 3000) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(elapsedMs, 0) : 0;
  return Math.max(0, Math.round(minMs - elapsed));
}

// Lintasan terbang Arsa dari tengah splash ke tempat bertenggernya (selisih tx, ty dari posisi
// awal). Awal selalu (0, 0) berskala 1, akhir tepat (tx, ty) berskala `endScale`; di tengah jalan
// ikut melengkung dan mengepak seperti saat Arsa terbang pulang setelah ditarik.
export function landingFrames(tx, ty, endScale, steps = 10) {
  return flightPath(-tx, -ty, steps).map((p) => ({
    x: tx + p.x,
    y: ty + p.y,
    rotate: p.rotate,
    scale: (1 + (endScale - 1) * p.offset) * p.scale,
    offset: p.offset,
  }));
}
