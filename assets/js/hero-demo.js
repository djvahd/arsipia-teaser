import { CONTEXTS, DEFAULT_CONTEXT } from "./lib/contexts.js";
import { tidyPercent, nextDest, foldersOf, folderCounts, hopPath } from "./lib/tidy.js";

const root = document.getElementById("heroDemo");

if (root) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EXT_LABEL = { pdf: "PDF", xls: "XLS", doc: "DOC", img: "JPG" };
  const STEP_MS = 230;
  const FLIGHT_MS = 560;
  const FOLDER_ICON =
    '<svg class="folder__icon" viewBox="0 0 28 24" width="28" height="24" aria-hidden="true"><path class="folder__back" d="M2 5a2 2 0 0 1 2-2h6l3 3h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path class="folder__front" d="M2 10a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>';

  const el = {
    files: root.querySelector("#demoFiles"),
    folders: root.querySelector("#demoFolders"),
    percent: root.querySelector("#demoPercent"),
    meter: root.querySelector("#demoMeter"),
    meterBox: root.querySelector(".meter"),
    status: root.querySelector("#demoStatus"),
    action: root.querySelector("#demoAction"),
    speech: root.querySelector("#demoSpeech"),
    arsa: root.querySelector("#demoArsa"),
  };
  const chips = [...document.querySelectorAll(".ctx__chip")];

  let ctxKey = DEFAULT_CONTEXT;
  let phase = "idle";
  let files = [];
  let timers = [];

  const h = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  const terms = () => CONTEXTS[ctxKey].terms;
  const folderNames = () => foldersOf(CONTEXTS[ctxKey].files);

  function say(text, expr) {
    el.speech.textContent = text;
    el.arsa.dataset.expr = expr;
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderMeter() {
    const placed = files.filter((f) => f.placed).length;
    const percent = tidyPercent(files.length, placed);
    el.percent.textContent = `${percent}%`;
    el.meter.style.width = `${percent}%`;
    el.meterBox.setAttribute("aria-valuenow", String(percent));
  }

  function renderFolders() {
    el.folders.replaceChildren(
      ...folderNames().map((name) => {
        const chip = h("span", "folder");
        chip.dataset.dest = name;
        chip.innerHTML = FOLDER_ICON;
        chip.append(h("span", "folder__name", name), h("b", "", "0"));
        return chip;
      }),
    );
  }

  function updateFolders(popDest) {
    const counts = folderCounts(files);
    el.folders.querySelectorAll(".folder").forEach((chip) => {
      chip.querySelector("b").textContent = String(counts[chip.dataset.dest] || 0);
      if (chip.dataset.dest !== popDest) return;
      chip.classList.remove("is-pop");
      void chip.offsetWidth;
      chip.classList.add("is-pop");
    });
  }

  // Ikon file (DOC/PDF/XLS/JPG) lepas dari barisnya, melompat melengkung, lalu masuk ke ikon folder tujuan.
  function flyBadge(badge, target, onLand) {
    const from = badge.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const { mid } = hopPath(dx, dy);

    const flyer = badge.cloneNode(true);
    flyer.classList.add("file-flyer");
    Object.assign(flyer.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      fontSize: getComputedStyle(badge).fontSize,
    });
    document.body.append(flyer);
    badge.style.visibility = "hidden";

    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      flyer.remove();
      onLand();
    };

    const animation = flyer.animate(
      [
        { translate: "0 0", rotate: "0deg", scale: "1" },
        { translate: `${mid.x}px ${mid.y}px`, rotate: "-14deg", scale: "1.2", offset: 0.5 },
        { translate: `${dx}px ${dy}px`, rotate: "8deg", scale: "0.45" },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.4, 0, 0.3, 1)", fill: "forwards" },
    );
    animation.onfinish = land;
    // Cadangan bila event animasi tertunda (misalnya tab di latar belakang).
    setTimeout(land, FLIGHT_MS + 120);
  }

  function renderFiles() {
    el.files.className = "files";
    el.files.replaceChildren(
      ...files.map((f) => {
        const li = h("li", "file");
        li.dataset.id = String(f.id);
        const tag = h("button", "file__to", f.dest);
        tag.type = "button";
        tag.disabled = true;
        tag.setAttribute("aria-label", `Tujuan ${f.name}: ${f.dest}`);
        li.append(h("span", `file__ext file__ext--${f.ext}`, EXT_LABEL[f.ext]), h("span", "file__name", f.name), tag);
        return li;
      }),
    );
  }

  // Jendela boleh menutup menyusut saat dirapikan, tapi tinggi panggung dikunci
  // supaya bagian halaman di bawahnya tidak bergeser.
  // Tinggi panggung dikunci supaya halaman tidak menyusut saat jendela menutup. Hanya di layar
  // lebar: di ponsel dan tablet ruang kosong di bawah jendela justru terlihat janggal.
  const compact = window.matchMedia("(max-width: 1000px)");

  function lockHeight() {
    root.style.minHeight = "";
    if (compact.matches) return;
    root.style.minHeight = `${root.offsetHeight}px`;
  }

  function syncTags() {
    const editable = phase === "suggested";
    el.files.querySelectorAll(".file__to").forEach((tag) => {
      tag.disabled = !editable;
    });
  }

  function load(key) {
    clearTimers();
    ctxKey = key;
    phase = "idle";
    files = CONTEXTS[key].files.map((f, id) => ({ ...f, id, placed: false }));

    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.ctx === key)));
    document.querySelectorAll("[data-term]").forEach((node) => {
      node.textContent = terms()[node.dataset.term];
    });

    renderFiles();
    renderFolders();
    renderMeter();

    el.action.disabled = false;
    el.action.textContent = "Rapikan, Arsa!";
    el.status.textContent = `${files.length} file berantakan di Drive ${terms().team}.`;
    say(`${cap(terms().team)} baru, proyek baru, mulai dari mana?`, "shock");
    lockHeight();
  }

  function suggest() {
    phase = "suggested";
    el.files.classList.add("is-tagged");
    syncTags();
    el.action.textContent = "Setujui semua";
    el.status.textContent = `${files.length} saran siap ditinjau. Klik tag untuk mengubah tujuan.`;
    say("Ini saranku. Cek dulu, ya.", "think");
  }

  function place(file) {
    const row = el.files.children[file.id];
    const chip = el.folders.querySelector(`.folder[data-dest="${CSS.escape(file.dest)}"]`);
    const land = () => {
      file.placed = true;
      row.classList.add("is-sent");
      updateFolders(file.dest);
      renderMeter();
    };

    if (reduced || !chip) {
      land();
      return;
    }
    flyBadge(row.querySelector(".file__ext"), chip.querySelector(".folder__icon"), land);
  }

  function finish() {
    // Baris memudar bergiliran dari atas, baru daftarnya menutup (lihat .file.is-moved).
    el.files.querySelectorAll(".file").forEach((row, i) => {
      row.style.setProperty("--i", i);
      row.classList.add("is-moved");
    });
    phase = "done";
    el.action.disabled = false;
    el.action.textContent = "Berantakin lagi";
    el.status.textContent = "Beres! Drive rapi dan siap diwariskan.";
    say("Beres! Giliranmu sekarang.", "celebrate");
  }

  function approve() {
    phase = "moving";
    syncTags();
    el.action.disabled = true;
    el.status.textContent = "Memindahkan file...";
    say("Sip, langsung kurapikan!", "happy");
    files.forEach((file, i) => timers.push(setTimeout(() => place(file), reduced ? 0 : i * STEP_MS)));
    timers.push(setTimeout(finish, reduced ? 0 : (files.length - 1) * STEP_MS + FLIGHT_MS + 450));
  }

  el.action.addEventListener("click", () => {
    if (phase === "idle") suggest();
    else if (phase === "suggested") approve();
    else if (phase === "done") load(ctxKey);
  });

  el.files.addEventListener("click", (event) => {
    const tag = event.target.closest(".file__to");
    if (!tag || phase !== "suggested") return;
    const file = files[Number(tag.closest(".file").dataset.id)];
    file.dest = nextDest(file.dest, folderNames());
    tag.textContent = file.dest;
    tag.setAttribute("aria-label", `Tujuan ${file.name}: ${file.dest}`);
  });

  window.addEventListener("resize", () => {
    if (phase !== "done") lockHeight();
  });
  // Di ponsel dan tablet tinggi panggung berubah (saran muncul, daftar menutup, direset), sehingga
  // bagian halaman di bawahnya bergeser. Posisi pemicu fade scroll dihitung ulang setelah ukurannya
  // tenang, kalau tidak fade di bawahnya meleset dari posisi sebenarnya.
  if (window.ResizeObserver) {
    let settle = 0;
    new ResizeObserver(() => {
      clearTimeout(settle);
      settle = setTimeout(() => window.ScrollTrigger?.refresh(), 150);
    }).observe(root);
  }

  compact.addEventListener("change", () => {
    if (compact.matches || phase !== "done") lockHeight();
  });
  chips.forEach((chip) => chip.addEventListener("click", () => load(chip.dataset.ctx)));

  load(DEFAULT_CONTEXT);

  // Ukur ulang setelah font DM Sans termuat, supaya kunci tinggi memakai ukuran akhir.
  document.fonts?.ready.then(() => {
    if (phase !== "done") lockHeight();
  });
}
