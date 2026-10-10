const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ctaArsa = document.getElementById("ctaArsa");

if (!reduced && window.gsap && window.ScrollTrigger) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Di ponsel ScrollTrigger tidak perlu menghitung ulang tiap bilah alamat muncul atau sembunyi.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Memudar masuk saat mendekati layar dan memudar keluar saat meninggalkannya. Terikat langsung
  // ke posisi scroll (scrub), jadi berlaku dua arah, tanpa jeda atau gerak naik. Hanya opacity,
  // sehingga tidak bentrok dengan efek hover (transform) pada kartu. Zona pudar dinyatakan dalam
  // persen tinggi layar (bukan persen tinggi elemen), jadi di layar kecil dan untuk elemen tinggi
  // pun hanya pinggir atas dan bawah layar yang memudar; bagian tengah selalu jelas.
  const FADE_ZONE = 14;
  // Layar sentuh: jeda penghalusan scrub dipendekkan supaya fade tidak tertinggal saat jari menyapu cepat.
  const SCRUB = window.matchMedia("(pointer: coarse)").matches ? 0.1 : 0.25;

  const fadeBothWays = (el, index = 0) => {
    const stagger = index * 2;
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: `top ${97 - stagger}%`, end: `top ${97 - stagger - FADE_ZONE}%`, scrub: SCRUB },
      },
    );
    gsap.fromTo(
      el,
      { opacity: 1 },
      {
        opacity: 0,
        ease: "none",
        immediateRender: false,
        scrollTrigger: { trigger: el, start: `bottom ${6 + FADE_ZONE}%`, end: "bottom 6%", scrub: SCRUB },
      },
    );
  };

  // Tinggi halaman bisa berubah setelah pemicu dihitung (font DM Sans selesai dimuat, teks
  // membungkus lain di layar sempit, panggung demo membuka atau menutup). Hitung ulang posisi
  // pemicu begitu ukurannya tenang, supaya fade tidak meleset dari posisi elemen sebenarnya.
  let refreshTimer = 0;
  const refreshSoon = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  document.fonts?.ready.then(refreshSoon);
  if (window.ResizeObserver) new ResizeObserver(refreshSoon).observe(document.body);

  // Elemen sebaris dibedakan sedikit titik mulainya agar memudar bergelombang, bukan serentak.
  const fadeAll = (selector) => {
    gsap.utils.toArray(selector).forEach((el) => {
      const siblings = el.parentElement ? [...el.parentElement.children] : [el];
      fadeBothWays(el, siblings.indexOf(el) % 4);
    });
  };

  // Bab 2: stiker kekacauan dan kartu masalah.
  fadeAll("#masalah .section-head, .chaos span, #masalah .card");

  // Bab 3: kalimat dan kartu kehilangan.
  fadeAll(".reveal-line");

  // Bab 4: garis penghubung tergambar, langkah muncul bertahap.
  gsap.fromTo(
    ".steps__line",
    { scaleX: 0 },
    { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 65%", scrub: true } },
  );
  fadeAll("#cara-kerja .section-head, .step");

  // Bab 5: kartu fitur dan teaser.
  fadeAll("#fitur .section-head, #fitur .card, .teaser");

  // Bab 6: kartu CTA.
  fadeAll(".cta");

  // Bab 6: Arsa merayakan saat CTA terlihat.
  if (ctaArsa) {
    ScrollTrigger.create({
      trigger: "#mulai",
      start: "top 70%",
      onEnter: () => {
        ctaArsa.dataset.expr = "celebrate";
      },
      onLeaveBack: () => {
        ctaArsa.dataset.expr = "happy";
      },
    });
  }
}
