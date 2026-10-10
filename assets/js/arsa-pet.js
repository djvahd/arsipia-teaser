import { lookVector, clampDelta, flightPlan, flightPath, pickTrick, isDizzy, HOP_FRAMES } from "./lib/pet-motion.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAG_THRESHOLD = 6;

const TRICK_FRAMES = {
  hop: HOP_FRAMES,
  spin: [
    { rotate: "0deg", scale: "1" },
    { rotate: "200deg", scale: "1.12", offset: 0.5 },
    { rotate: "360deg", scale: "1" },
  ],
  wiggle: [
    { rotate: "0deg" },
    { rotate: "-14deg" },
    { rotate: "12deg" },
    { rotate: "-9deg" },
    { rotate: "6deg" },
    { rotate: "0deg" },
  ],
  flap: [
    { translate: "0 0" },
    { translate: "0 -18px" },
    { translate: "0 -6px" },
    { translate: "0 -22px" },
    { translate: "0 0" },
  ],
};
const TRICK_MS = { hop: 520, spin: 650, wiggle: 600, flap: 900 };
const TRICK_SAY = { hop: "Hup!", spin: "Wiii~", wiggle: "Hihi, geli!", flap: "Terbang dulu~" };
const TRICK_EXPR = { hop: "celebrate", spin: "happy", wiggle: "shock", flap: "celebrate" };

const pets = [...document.querySelectorAll("[data-pet]")];
pets.forEach(initPet);

if (!reduced && pets.length && window.matchMedia("(pointer: fine)").matches) trackPointer();

function trackPointer() {
  let frame = 0;
  let pointer = null;

  const update = () => {
    frame = 0;
    for (const pet of pets) {
      const box = pet.getBoundingClientRect();
      const look = lookVector({ x: box.left + box.width / 2, y: box.top + box.height / 2 }, pointer);
      pet.style.setProperty("--look-x", `${look.x.toFixed(2)}px`);
      pet.style.setProperty("--look-y", `${look.y.toFixed(2)}px`);
    }
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
}

function initPet(pet) {
  const speechEl = pet.dataset.petSpeech ? document.querySelector(pet.dataset.petSpeech) : null;
  let current = null;
  let lastTrick = null;
  let clicks = [];
  let drag = null;
  const draggable = pet.hasAttribute("data-pet-drag");
  let saidTimer = 0;
  let savedSpeech = null;

  function say(text, ms = 2200) {
    if (!speechEl) return;
    if (savedSpeech === null) savedSpeech = speechEl.textContent;
    speechEl.textContent = text;
    clearTimeout(saidTimer);
    saidTimer = setTimeout(() => {
      if (speechEl.textContent === text) speechEl.textContent = savedSpeech;
      savedSpeech = null;
    }, ms);
  }

  function tempExpr(expr, ms) {
    const previous = pet.dataset.expr;
    pet.dataset.expr = expr;
    setTimeout(() => {
      if (pet.dataset.expr === expr) pet.dataset.expr = previous;
    }, ms);
  }

  function play(frames, duration, easing = "ease-in-out") {
    current?.cancel();
    if (reduced) return null;
    current = pet.animate(frames, { duration, easing });
    return current;
  }

  function trick(name, message) {
    lastTrick = name;
    say(message ?? TRICK_SAY[name]);
    tempExpr(TRICK_EXPR[name], TRICK_MS[name]);
    if (name === "flap") pet.classList.add("is-flying");
    const animation = play(TRICK_FRAMES[name], TRICK_MS[name]);
    if (name === "flap") setTimeout(() => pet.classList.remove("is-flying"), TRICK_MS.flap);
    return animation;
  }

  // Maskot yang sedang tidur: diklik membuatnya terbangun kaget, lalu tertidur lagi.
  const sleepy = pet.hasAttribute("data-pet-sleepy");
  const sleepExpr = pet.dataset.expr;
  let wakeTimer = 0;

  function startle() {
    clearTimeout(wakeTimer);
    pet.dataset.expr = "shock";
    play(TRICK_FRAMES.hop, TRICK_MS.hop);
    wakeTimer = setTimeout(() => {
      pet.dataset.expr = sleepExpr;
    }, 1800);
  }

  function click() {
    if (sleepy) return startle();
    const now = performance.now();
    clicks = [...clicks, now].filter((t) => now - t <= 3000);
    if (isDizzy(clicks, now)) {
      clicks = [];
      say("Pusing... udah dong!", 2600);
      tempExpr("think", 1400);
      play([{ rotate: "0deg" }, { rotate: "720deg" }], 1100);
      return;
    }
    trick(pickTrick(lastTrick));
  }

  // Bulu kecil rontok di jejak terbang lalu melayang jatuh dan memudar.
  function shedFeather() {
    const box = pet.getBoundingClientRect();
    const feather = document.createElement("span");
    feather.className = "pet-feather";
    feather.style.left = `${box.left + box.width * (0.3 + Math.random() * 0.4)}px`;
    feather.style.top = `${box.top + box.height * (0.4 + Math.random() * 0.4)}px`;
    document.body.append(feather);
    const animation = feather.animate(
      [
        { translate: "0 0", rotate: "0deg", opacity: 0.9 },
        { translate: `${(Math.random() - 0.5) * 44}px 52px`, rotate: `${(Math.random() - 0.5) * 180}deg`, opacity: 0 },
      ],
      { duration: 800, easing: "ease-out" },
    );
    animation.onfinish = () => feather.remove();
    setTimeout(() => feather.remove(), 950);
  }

  function flyHome(dx, dy, home) {
    pet.classList.remove("is-dragging");
    pet.style.translate = "";
    pet.style.rotate = "";
    let trail = 0;
    const restore = () => {
      clearInterval(trail);
      pet.classList.remove("is-flying");
      pet.dataset.expr = home.expr;
      pet.style.position = home.position;
      pet.style.zIndex = "";
    };

    if (reduced || (dx === 0 && dy === 0)) {
      restore();
      return;
    }

    const plan = flightPlan(dx, dy);
    pet.classList.add("is-flying");
    pet.dataset.expr = "celebrate";
    say("Aku pulang yaa~", plan.duration + 900);
    trail = setInterval(shedFeather, 110);
    const animation = play(
      flightPath(dx, dy).map((p) => ({
        translate: `${p.x}px ${p.y}px`,
        rotate: `${p.rotate}deg`,
        scale: String(p.scale),
        offset: p.offset,
      })),
      plan.duration,
      "ease-in-out",
    );
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      restore();
      play(TRICK_FRAMES.hop, TRICK_MS.hop);
    };
    animation.onfinish = land;
    animation.oncancel = restore;
    // Cadangan bila event animasi tertunda (misalnya tab di latar belakang).
    setTimeout(land, plan.duration + 120);
  }

  // Baru dipencet: kaget seperti saat hendak mendarat di tenggeran, yaitu tersentak dan memantul
  // kecil dengan mata melotot. Hanya skala dan miring (tanpa translate), supaya bila langsung
  // ditarik, gerakannya tidak terpotong dan posisi seretan tetap terlihat.
  let startleAnim = null;
  function startleOnPress() {
    pet.dataset.expr = "shock";
    startleAnim = play(
      [
        { scale: "0.97 1.05", rotate: "0deg" },
        { scale: "1.1 0.88", rotate: "-3deg", offset: 0.4 },
        { scale: "0.98 1.03", rotate: "2deg", offset: 0.7 },
        { scale: "1 1", rotate: "0deg" },
      ],
      340,
      "ease-out",
    );
  }

  pet.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (draggable) {
      try {
        pet.setPointerCapture(event.pointerId);
      } catch {
        /* pointer tidak bisa ditangkap: seret tetap jalan selama kursor di atas maskot */
      }
    }
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rect: pet.getBoundingClientRect(),
      expr: pet.dataset.expr,
      position: pet.style.position,
      moved: false,
      dx: 0,
      dy: 0,
      featherAt: 0,
      featherX: 0,
      featherY: 0,
    };
    if (draggable) startleOnPress();
  });

  pet.addEventListener("pointermove", (event) => {
    if (!draggable || !drag || event.pointerId !== drag.id) return;
    const rawX = event.clientX - drag.x;
    const rawY = event.clientY - drag.y;

    if (!drag.moved) {
      if (Math.hypot(rawX, rawY) < DRAG_THRESHOLD) return;
      drag.moved = true;
      if (current !== startleAnim) current?.cancel();
      if (getComputedStyle(pet).position === "static") pet.style.position = "relative";
      pet.style.zIndex = "70";
      pet.classList.add("is-dragging", "is-flying");
      pet.dataset.expr = "shock";
      say("Eh, eh, mau dibawa ke mana?!", 4000);
    }

    const delta = clampDelta({ x: rawX, y: rawY }, drag.rect, { width: window.innerWidth, height: window.innerHeight });
    // Badan miring mengikuti arah tarikan seperti menggantung, lalu kembali tegak bila kursor diam.
    pet.style.rotate = `${Math.max(-24, Math.min(24, (delta.x - drag.dx) * 1.8))}deg`;
    clearTimeout(drag.settle);
    drag.settle = setTimeout(() => {
      pet.style.rotate = "0deg";
    }, 100);
    // Senang selagi terbang digerakkan, kaget lagi begitu berhenti tapi masih dipegang.
    pet.dataset.expr = "celebrate";
    clearTimeout(drag.idle);
    drag.idle = setTimeout(() => {
      pet.dataset.expr = "shock";
    }, 260);
    // Bulu rontok hanya selagi digerakkan; saat diam di tempat tidak ada yang jatuh.
    const now = performance.now();
    if (!reduced && now - drag.featherAt > 110 && Math.hypot(delta.x - drag.featherX, delta.y - drag.featherY) > 12) {
      shedFeather();
      drag.featherAt = now;
      drag.featherX = delta.x;
      drag.featherY = delta.y;
    }
    drag.dx = delta.x;
    drag.dy = delta.y;
    pet.style.translate = `${delta.x}px ${delta.y}px`;
  });

  const release = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const finished = drag;
    drag = null;
    clearTimeout(finished.settle);
    clearTimeout(finished.idle);
    try {
      if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    } catch {
      /* sudah dilepas */
    }

    if (!finished.moved) {
      if (draggable) pet.dataset.expr = finished.expr;
      // pointercancel (misalnya jari mulai menggulir halaman) bukan klik.
      if (event.type === "pointerup") click();
      return;
    }
    flyHome(finished.dx, finished.dy, finished);
  };

  pet.addEventListener("pointerup", release);
  pet.addEventListener("pointercancel", release);
  pet.addEventListener("dragstart", (event) => event.preventDefault());

  // Maskot yang sedang mencari (halaman 404): saat kursor diam, matanya menoleh ke sana-sini
  // dan ekspresinya bergantian antara kaget dan berpikir.
  if (!reduced && pet.hasAttribute("data-pet-wander")) {
    let lastMove = 0;
    window.addEventListener(
      "pointermove",
      () => {
        lastMove = performance.now();
      },
      { passive: true },
    );

    const lookAround = () => {
      if (!document.hidden && !drag && performance.now() - lastMove > 1800) {
        const angle = Math.random() * Math.PI * 2;
        const reach = 2 + Math.random();
        pet.style.setProperty("--look-x", `${(Math.cos(angle) * reach).toFixed(2)}px`);
        pet.style.setProperty("--look-y", `${(Math.sin(angle) * reach).toFixed(2)}px`);
      }
      setTimeout(lookAround, 900 + Math.random() * 900);
    };
    setTimeout(lookAround, 1200);

    setInterval(() => {
      if (drag || document.hidden) return;
      if (pet.dataset.expr === "shock") pet.dataset.expr = "think";
      else if (pet.dataset.expr === "think") pet.dataset.expr = "shock";
    }, 2600);
  }

  // Berkedip sesekali supaya terasa hidup.
  if (!reduced) {
    const blink = () => {
      if (!document.hidden) {
        pet.classList.add("is-blink");
        setTimeout(() => pet.classList.remove("is-blink"), 140);
      }
      setTimeout(blink, 2500 + Math.random() * 3500);
    };
    setTimeout(blink, 1500 + Math.random() * 2000);
  }
}
