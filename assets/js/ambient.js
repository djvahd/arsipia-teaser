const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduced) {
  const ICONS = [
    '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ];

  const layer = document.createElement("div");
  layer.className = "ambient";
  layer.setAttribute("aria-hidden", "true");

  const items = [];
  for (let i = 0; i < 14; i++) {
    const size = 22 + Math.random() * 24;
    const item = document.createElement("div");
    item.className = "ambient__item";
    item.style.left = `${Math.random() * 96}%`;
    item.style.top = `${Math.random() * 92}%`;
    item.innerHTML = `<svg class="ambient__icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${(-Math.random() * 14).toFixed(1)}s">${ICONS[i % ICONS.length]}</svg>`;
    layer.append(item);
    items.push({ node: item, depth: 0.2 + Math.random() * 0.8 });
  }
  document.body.prepend(layer);

  if (window.matchMedia("(pointer: fine)").matches) {
    let tx = 0;
    let ty = 0;
    let frame = 0;

    const apply = () => {
      frame = 0;
      for (const { node, depth } of items) {
        node.style.transform = `translate3d(${-tx * 40 * depth}px, ${-ty * 40 * depth}px, 0)`;
      }
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        tx = event.clientX / window.innerWidth - 0.5;
        ty = event.clientY / window.innerHeight - 0.5;
        if (!frame) frame = requestAnimationFrame(apply);
      },
      { passive: true },
    );
  }
}
