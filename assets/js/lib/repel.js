// Tolakan stiker dari kursor: menjauh lurus dari kursor, makin dekat makin kuat,
// nol di luar `radius`. `strength` (0..1) dipakai untuk memiringkan stiker sedikit.
export function repel(center, pointer, radius, maxPush) {
  const dx = center.x - pointer.x;
  const dy = center.y - pointer.y;
  const dist = Math.hypot(dx, dy);

  if (dist >= radius) return { x: 0, y: 0, strength: 0 };
  if (dist === 0) return { x: 0, y: -maxPush, strength: 1 };

  const strength = 1 - dist / radius;
  const push = maxPush * strength;
  return { x: (dx / dist) * push, y: (dy / dist) * push, strength };
}
