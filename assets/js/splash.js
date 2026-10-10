import { HOP_FRAMES } from "./lib/pet-motion.js";
import { remainingWait, landingFrames } from "./lib/splash.js";

// Splash hanya ada bila skrip di <head> memasang kelas `has-splash` (sekali per sesi, dan tidak
// saat prefers-reduced-motion). Tanpa kelas itu, berkas ini tidak melakukan apa pun.
const root = document.documentElement;

if (root.classList.contains("has-splash")) {
  const splash = document.querySelector(".splash");
  const MIN_VISIBLE_MS = 3000;
  const FAILSAFE_MS = 6000;
  const LOADED_FADE_MS = 300;
  const FLIGHT_MS = 2200; // 3000 + 300 + 2200 = 5,5 detik sampai Arsa bertengger
  let finished = false;

  const cleanup = (perch) => {
    if (perch) perch.style.visibility = "";
    root.classList.remove("has-splash");
    splash?.remove();
  };

  // Bulu kecil rontok di jejak terbang, seperti saat Arsa terbang pulang setelah ditarik.
  const shedFeather = (mascot) => {
    const box = mascot.getBoundingClientRect();
    const feather = document.createElement("span");
    feather.className = "pet-feather";
    feather.style.zIndex = "310";
    feather.style.left = `${box.left + box.width * (0.3 + Math.random() * 0.4)}px`;
    feather.style.top = `${box.top + box.height * (0.4 + Math.random() * 0.4)}px`;
    document.body.append(feather);
    const fall = feather.animate(
      [
        { translate: "0 0", rotate: "0deg", opacity: 0.9 },
        { translate: `${(Math.random() - 0.5) * 44}px 52px`, rotate: `${(Math.random() - 0.5) * 180}deg`, opacity: 0 },
      ],
      { duration: 800, easing: "ease-out" },
    );
    fall.onfinish = () => feather.remove();
    setTimeout(() => feather.remove(), 950);
  };

  // Urutannya: tulisan dan bar loading hilang dulu, lalu latar putih memudar pelan sambil Arsa
  // terbang (lintasan dan gaya yang sama dengan terbang pulang setelah ditarik) ke tempat
  // bertenggernya, mendarat dengan lompatan kecil. Bila tempat itu tidak terlihat di layar,
  // splash cukup memudar.
  const flyToPerch = () => {
    const mascot = splash?.querySelector(".splash__arsa");
    const perch = document.querySelector(".arsa[data-pet-drag]");
    if (!mascot || !perch || !mascot.animate) return false;

    const from = mascot.getBoundingClientRect();
    const to = perch.getBoundingClientRect();
    const visible = to.width > 0 && to.top >= 0 && to.bottom <= window.innerHeight;
    if (!visible) return false;

    const tx = to.left + to.width / 2 - (from.left + from.width / 2);
    const ty = to.top + to.height / 2 - (from.top + from.height / 2);
    const duration = FLIGHT_MS;
    const frames = landingFrames(tx, ty, to.width / from.width).map((p) => ({
      translate: `${p.x}px ${p.y}px`,
      rotate: `${p.rotate}deg`,
      scale: p.scale,
      offset: p.offset,
    }));

    perch.style.visibility = "hidden";
    mascot.style.animation = "none"; // berhenti melayang naik-turun selagi tulisan loading menghilang
    splash.classList.add("splash--loaded");

    setTimeout(() => {
      splash.classList.add("splash--fly");
      // Sama seperti terbang pulang: wajah senang, dan hentakan kecil selama terbang
      // (animasi `celebrate` dari arsa.css, yang kembali aktif begitu animasi inline dilepas).
      mascot.dataset.expr = "celebrate";
      mascot.style.animation = "";
      const trail = setInterval(() => shedFeather(mascot), 110);
      const flight = mascot.animate(frames, { duration, easing: "ease-in-out", fill: "forwards" });
      let landed = false;
      const land = () => {
        if (landed) return;
        landed = true;
        clearInterval(trail);
        cleanup(perch);
        // Mendarat dengan lompatan yang sama seperti terbang pulang setelah ditarik
        perch.animate?.(HOP_FRAMES, { duration: 520, easing: "ease-in-out" });
      };
      flight.onfinish = land;
      setTimeout(land, duration + 300);
    }, LOADED_FADE_MS);
    return true;
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      if (flyToPerch()) return;
    } catch (e) {}
    splash?.classList.add("splash--out");
    setTimeout(() => cleanup(), 380);
  };

  // Tunggu font siap (maksimal 1,5 detik), lalu pastikan splash sudah tampil cukup lama.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1500))]).then(() => {
    setTimeout(finish, remainingWait(performance.now(), MIN_VISIBLE_MS));
  });

  setTimeout(finish, FAILSAFE_MS);
}
