// Membuka Google Picker supaya pengguna memilih file dari Drive organisasi, lalu mengirim id-nya ke server.
// Server mengambil ulang data tiap file dari Drive, jadi yang dipercaya hanya id-nya.
const button = document.getElementById("pick-files");
const errorBox = document.getElementById("pick-error");

const showError = (message) => {
  errorBox.textContent = message;
  errorBox.hidden = false;
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error("Gagal memuat pemilih file Google. Periksa koneksi internetmu."));
    document.head.appendChild(el);
  });

async function openPicker() {
  errorBox.hidden = true;
  button.disabled = true;

  try {
    const response = await fetch(button.dataset.tokenUrl, { headers: { Accept: "application/json" } });
    const config = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(config.message ?? "Tidak bisa menyiapkan pemilih file.");

    if (!window.gapi) await loadScript("https://apis.google.com/js/api.js");
    await new Promise((resolve) => window.gapi.load("picker", resolve));

    const { picker } = window.google;
    // Folder bisa dijelajahi tapi tidak bisa dipilih: yang dipilih hanya file.
    const view = new picker.DocsView(picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(false);

    new picker.PickerBuilder()
      .addView(view)
      .enableFeature(picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(config.token)
      .setDeveloperKey(config.apiKey)
      .setAppId(config.appId)
      .setLocale("id")
      .setCallback((data) => {
        if (data.action !== picker.Action.PICKED) return;

        const form = document.getElementById(button.dataset.form);
        for (const doc of data.docs) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "files[]";
          input.value = doc.id;
          form.appendChild(input);
        }
        form.submit();
      })
      .build()
      .setVisible(true);
  } catch (error) {
    showError(error.message);
  } finally {
    button.disabled = false;
  }
}

if (button && errorBox) button.addEventListener("click", openPicker);
