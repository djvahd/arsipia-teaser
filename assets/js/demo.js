import { launchConfetti } from "./lib/confetti.js";
import { nextDest } from "./lib/tidy.js";
import {
  BADGES,
  DEST_OPTIONS,
  initialState,
  restore,
  scoreOf,
  resolveItem,
  setDest,
  toggleChecklist,
  exprForScore,
  unlockedBadges,
  newBadges,
  isHandoverComplete,
  handoverSummary,
} from "./lib/demo-state.js";

const STORAGE_KEY = "arsipia-demo-v1";
const RING_LENGTH = 2 * Math.PI * 52;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

const els = {
  ring: $("ring"),
  score: $("score"),
  live: $("scoreLive"),
  arsa: $("demoArsa"),
  caption: $("caption"),
  queue: $("queue"),
  badges: $("badges"),
  checklist: $("checklist"),
  verified: $("verified"),
  verifiedText: $("verifiedText"),
  copy: $("copyVerified"),
  reset: $("resetDemo"),
  toast: $("toast"),
  confetti: $("confetti"),
};

const ACTION_LABELS = {
  suggest: { approve: "Setujui", done: "Dipindahkan" },
  duplicate: { approve: "Hapus duplikat", done: "Dihapus" },
  metadata: { approve: "Tambah tag", done: "Tag ditambahkan" },
};

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function loadState() {
  try {
    return restore(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return initialState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan diblokir: demo tetap jalan tanpa menyimpan */
  }
}

let state = loadState();
let shown = 0;
let animation = 0;
let toastTimer = 0;

function captionFor(score) {
  if (score < 30) return "Waduh, Drive-nya berantakan. Mulai dari antrean saran, yuk.";
  if (score < 70) return "Mulai rapi! Lanjutkan, Arsa suka melihatnya.";
  if (score < 100) return "Hampir sempurna. Sedikit lagi.";
  return "Sempurna! Arsip siap diwariskan.";
}

function showScore(to, instant) {
  const id = ++animation;
  if (instant || reduced) {
    shown = to;
    els.score.textContent = String(to);
    return;
  }
  const from = shown;
  const start = performance.now();
  const duration = 450;
  function tick(now) {
    if (id !== animation) return;
    const t = Math.min((now - start) / duration, 1);
    els.score.textContent = String(Math.round(from + (to - from) * t));
    if (t < 1) requestAnimationFrame(tick);
    else shown = to;
  }
  requestAnimationFrame(tick);
}

function noteFor(q) {
  if (q.kind === "suggest") return q.status === "done" ? `Sekarang di folder ${q.dest}` : `Saran: → ${q.dest}`;
  return q.note;
}

function renderQueue() {
  els.queue.replaceChildren(
    ...state.queue.map((q) => {
      const li = h("li", `q q--${q.status}`);
      li.dataset.id = q.id;

      const info = h("div", "q__info");
      info.append(h("strong", "q__title", q.title), h("span", "q__note", noteFor(q)));
      li.append(info);

      if (q.status === "pending") {
        const actions = h("div", "q__actions");
        const approve = h("button", "btn btn-primary btn--xs", ACTION_LABELS[q.kind].approve);
        approve.type = "button";
        approve.dataset.action = "approve";
        actions.append(approve);
        if (q.kind === "suggest") {
          const change = h("button", "btn btn-outline btn--xs", "Ubah tujuan");
          change.type = "button";
          change.dataset.action = "change";
          actions.append(change);
        }
        const skip = h("button", "btn btn-outline btn--xs", q.kind === "duplicate" ? "Simpan" : "Lewati");
        skip.type = "button";
        skip.dataset.action = "skip";
        actions.append(skip);
        li.append(actions);
      } else {
        li.append(h("span", "q__state", q.status === "done" ? ACTION_LABELS[q.kind].done : "Dilewati"));
      }
      return li;
    }),
  );
}

function renderBadges(gained = []) {
  const on = new Set(unlockedBadges(state));
  els.badges.replaceChildren(
    ...BADGES.map((b) => {
      const li = h("li", `badge${on.has(b.id) ? " is-on" : ""}${gained.includes(b.id) ? " is-new" : ""}`);
      const icon = h("span", "badge__icon");
      icon.innerHTML =
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
      li.append(icon, h("span", "badge__name", b.name), h("span", "badge__hint", on.has(b.id) ? "Terbuka" : b.hint));
      return li;
    }),
  );
}

function renderChecklist() {
  if (els.checklist.children.length !== state.checklist.length) {
    els.checklist.replaceChildren(
      ...state.checklist.map((c) => {
        const li = h("li");
        const label = h("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.dataset.id = c.id;
        label.append(input, h("span", "", c.label));
        li.append(label);
        return li;
      }),
    );
  }
  els.checklist.querySelectorAll("input").forEach((input) => {
    input.checked = state.checklist.find((c) => c.id === input.dataset.id).done;
  });

  const complete = isHandoverComplete(state);
  els.verified.hidden = !complete;
  if (complete) {
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    els.verifiedText.textContent = handoverSummary(state, date);
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-show"), 3000);
}

function render(prev, instant = false) {
  const score = scoreOf(state);
  els.ring.style.strokeDashoffset = String(RING_LENGTH * (1 - score / 100));
  showScore(score, instant);
  els.live.textContent = `Skor kerapian ${score} dari 100`;
  els.arsa.dataset.expr = exprForScore(score);
  els.caption.textContent = captionFor(score);

  const gained = prev ? newBadges(prev, state) : [];
  renderQueue();
  renderBadges(gained);
  renderChecklist();

  if (gained.length) {
    const names = gained.map((id) => BADGES.find((b) => b.id === id).name).join(", ");
    showToast(`Lencana baru: ${names}`);
  }
  if (prev && !isHandoverComplete(prev) && isHandoverComplete(state)) launchConfetti(els.confetti);
}

function commit(prev) {
  saveState();
  render(prev);
}

els.queue.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest("li").dataset.id;
  const prev = state;

  if (button.dataset.action === "change") {
    const item = state.queue.find((q) => q.id === id);
    state = setDest(state, id, nextDest(item.dest, DEST_OPTIONS));
    commit(prev);
    els.queue.querySelector(`[data-id="${id}"] [data-action="change"]`)?.focus();
    return;
  }

  state = resolveItem(state, id, button.dataset.action);
  commit(prev);
  els.queue.querySelector("button")?.focus();
});

els.checklist.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-id]");
  if (!input) return;
  const prev = state;
  state = toggleChecklist(state, input.dataset.id);
  commit(prev);
});

els.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.verifiedText.textContent);
    showToast("Teks tersalin");
  } catch {
    showToast("Gagal menyalin, salin manual dari kartu");
  }
});

els.reset.addEventListener("click", () => {
  state = initialState();
  saveState();
  render(null, true);
});

render(null, true);
