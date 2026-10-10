export const TRICKS = ["hop", "spin", "wiggle", "flap"];

// Arah pandang pupil: menuju kursor, makin dekat makin kecil, dibatasi `max` unit SVG.
export function lookVector(center, pointer, max = 3, reach = 220) {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0 };
  const k = (Math.min(dist / reach, 1) * max) / dist;
  return { x: dx * k, y: dy * k };
}

// Batasi pergeseran seret agar maskot tetap berada di dalam viewport.
export function clampDelta(delta, rect, viewport, margin = 8) {
  return {
    x: Math.min(Math.max(delta.x, margin - rect.left), viewport.width - margin - rect.right),
    y: Math.min(Math.max(delta.y, margin - rect.top), viewport.height - margin - rect.bottom),
  };
}

// Durasi terbang pulang mengikuti jarak, dibatasi 1,6 sampai 2,6 detik (santai, tidak terburu-buru).
// Lompatan kecil saat Arsa mendarat di tenggeran (dipakai terbang pulang dan splash)
export const HOP_FRAMES = [
  { translate: "0 0", scale: "1 1" },
  { translate: "0 -30px", scale: "0.96 1.06", offset: 0.4 },
  { translate: "0 0", scale: "1.08 0.9", offset: 0.8 },
  { translate: "0 0", scale: "1 1" },
];

export function flightPlan(dx, dy) {
  const dist = Math.hypot(dx, dy);
  return { duration: Math.round(Math.min(2600, Math.max(1600, 1400 + dist * 1.5))) };
}

// Titik-titik lintasan terbang: kurva melengkung tinggi dengan ayunan kiri-kanan yang mereda,
// badan miring mengikuti ayunan, dan membesar di puncak (seolah mendekat ke penonton).
export function flightPath(dx, dy, steps = 10) {
  const dist = Math.hypot(dx, dy);
  const lift = Math.min(160, 50 + dist * 0.3);
  const cx = dx * 0.5;
  const cy = dy * 0.5 - lift;
  const lean = dx >= 0 ? -1 : 1;

  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const sway = Math.sin(t * Math.PI * 4) * (1 - t) * 14;
    return {
      x: u * u * dx + 2 * u * t * cx + sway,
      y: u * u * dy + 2 * u * t * cy,
      rotate: Math.sin(t * Math.PI * 3) * 14 * (1 - t) + lean * 10 * Math.sin(t * Math.PI),
      scale: 1 + 0.22 * Math.sin(t * Math.PI),
      offset: t,
    };
  });
}

export function pickTrick(last, random = Math.random) {
  const pool = TRICKS.filter((trick) => trick !== last);
  return pool[Math.floor(random() * pool.length)];
}

export function isDizzy(clickTimes, now, windowMs = 3000, threshold = 5) {
  return clickTimes.filter((t) => now - t <= windowMs).length >= threshold;
}
