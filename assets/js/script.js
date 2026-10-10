const form = document.getElementById("cta-form");
const note = document.getElementById("cta-note");

// Form tetap berfungsi tanpa JavaScript (kirim biasa lalu kembali ke #mulai). Dengan JavaScript, pesannya muncul di tempat.
if (form && note) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type='email']");
    const button = form.querySelector("button[type='submit']");
    if (!input.value.trim()) return;

    button.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        note.textContent = data.message ?? `Terima kasih! Kami akan menghubungi ${input.value.trim()} saat Arsipia siap dicoba.`;
        form.reset();
      } else if (response.status === 422) {
        note.textContent = data.errors?.email?.[0] ?? "Periksa lagi alamat emailnya.";
      } else if (response.status === 429) {
        note.textContent = "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
      } else {
        note.textContent = "Belum berhasil menyimpan. Coba lagi sebentar lagi.";
      }
    } catch {
      note.textContent = "Tidak bisa terhubung. Periksa koneksimu lalu coba lagi.";
    } finally {
      button.disabled = false;
    }
  });
}
