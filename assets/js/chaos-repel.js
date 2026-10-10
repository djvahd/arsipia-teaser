import { repel } from "./lib/repel.js";
import { clampDelta } from "./lib/pet-motion.js";

const section = document.getElementById("masalah");
const area = document.querySelector(".chaos");
const interactive =
  window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (section && area && interactive) {
  const RADIUS = 150;
  const MAX_PUSH = 90;
  const stickers = [...area.querySelectorAll("span")];
  let pointer = null;
  let frame = 0;

  const settle = () => {
    for (const sticker of stickers) {
      sticker.style.translate = "";
      sticker.style.rotate = "";
    }
  };

  const update = () => {
    frame = 0;
    if (!pointer) return settle();

    const box = area.getBoundingClientRect();
    for (const sticker of stickers) {
      // Posisi diam (offset layout) supaya tidak terpengaruh geseran yang sedang berjalan.
      const left = sticker.offsetLeft;
      const top = sticker.offsetTop;
      const width = sticker.offsetWidth;
      const height = sticker.offsetHeight;
      const center = { x: box.left + left + width / 2, y: box.top + top + height / 2 };

      const push = repel(center, pointer, RADIUS, MAX_PUSH);
      const keepInside = clampDelta(
        push,
        { left, right: left + width, top, bottom: top + height },
        { width: box.width, height: box.height },
        4,
      );
      sticker.style.translate = `${keepInside.x.toFixed(1)}px ${keepInside.y.toFixed(1)}px`;
      sticker.style.rotate = `${((push.x >= 0 ? 1 : -1) * push.strength * 10).toFixed(1)}deg`;
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  section.addEventListener(
    "pointermove",
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    },
    { passive: true },
  );

  section.addEventListener("pointerleave", () => {
    pointer = null;
    schedule();
  });
}
