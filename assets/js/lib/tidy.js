export const START_PERCENT = 12;

export function tidyPercent(total, placed) {
  if (total <= 0) return 100;
  const ratio = Math.min(Math.max(placed / total, 0), 1);
  return Math.round(START_PERCENT + (100 - START_PERCENT) * ratio);
}

export function nextDest(current, folders) {
  const index = folders.indexOf(current);
  return folders[(index + 1) % folders.length];
}

// Titik tengah lintasan lompat ikon file ke folder: melengkung ke atas, lebih tinggi untuk jarak lebih jauh.
export function hopPath(dx, dy) {
  const lift = Math.min(90, 30 + Math.hypot(dx, dy) * 0.25);
  return { mid: { x: dx * 0.5, y: dy * 0.5 - lift } };
}

export function foldersOf(files) {
  return [...new Set(files.map((file) => file.dest))];
}

export function folderCounts(files) {
  const counts = {};
  for (const file of files) {
    if (file.placed) counts[file.dest] = (counts[file.dest] || 0) + 1;
  }
  return counts;
}
