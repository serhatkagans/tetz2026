const { db, firestore } = window.tetz;
const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} = firestore;

function ortakAlanlariBul(arr1 = [], arr2 = []) {
  const set2 = new Set(arr2);
  return arr1.filter((alan) => set2.has(alan));
}

/**
 * Jaccard benzerliği: |A ∩ B| / |A ∪ B| × 100
 */
export function hesaplaPuan(ogrenci1, ogrenci2) {
  const a1 = ogrenci1?.ilgiAlanlari ?? [];
  const a2 = ogrenci2?.ilgiAlanlari ?? [];

  const birlesim = new Set([...a1, ...a2]);
  if (birlesim.size === 0) return 0;

  const ortakSayisi = ortakAlanlariBul(a1, a2).length;
  return Math.round((ortakSayisi / birlesim.size) * 100);
}

export async function enIyiEslesmeler(ogrenciId) {
  const ogrenciRef = doc(db, "students", ogrenciId);
  const ogrenciSnap = await getDoc(ogrenciRef);
  if (!ogrenciSnap.exists()) return [];

  const ogrenci = { id: ogrenciSnap.id, ...ogrenciSnap.data() };

  const adaySorgusu = query(
    collection(db, "students"),
    where("onaylandi", "==", true),
    where("bulusmaKabul", "==", true)
  );

  const snap = await getDocs(adaySorgusu);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((aday) => aday.id !== ogrenciId)
    .map((aday) => {
      const ortakAlanlar = ortakAlanlariBul(
        ogrenci.ilgiAlanlari,
        aday.ilgiAlanlari
      );
      return {
        ogrenci: aday,
        puan: hesaplaPuan(ogrenci, aday),
        ortakAlanlar
      };
    })
    .sort((a, b) => b.puan - a.puan)
    .slice(0, 3);
}

export async function eslesmeleriKaydet(ogrenciId) {
  const eslesmeler = await enIyiEslesmeler(ogrenciId);

  await Promise.all(
    eslesmeler.map((e) =>
      addDoc(collection(db, "matches"), {
        ogrenci1Id: ogrenciId,
        ogrenci2Id: e.ogrenci.id,
        puan: e.puan,
        ortakAlanlar: e.ortakAlanlar,
        durum: "oneri",
        tarih: serverTimestamp()
      })
    )
  );

  return eslesmeler;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderOneriler(containerId, ogrenciId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Konteyner bulunamadı: ${containerId}`);
    return;
  }

  container.innerHTML = `<p class="muted">Öneriler yükleniyor…</p>`;

  try {
    const eslesmeler = await enIyiEslesmeler(ogrenciId);

    if (eslesmeler.length === 0) {
      container.innerHTML = `
        <section class="oneriler">
          <h2>Senin için öneriler</h2>
          <p class="muted">Şu an uygun eşleşme bulunamadı.</p>
        </section>
      `;
      return;
    }

    const kartlar = eslesmeler
      .map(
        ({ ogrenci, puan, ortakAlanlar }) => `
        <article class="eslesme-kart">
          <div class="eslesme-kart__ust">
            <h3>${escapeHtml(ogrenci.ad ?? "İsimsiz")}</h3>
            <span class="eslesme-kart__puan">%${puan}</span>
          </div>
          <p class="eslesme-kart__okul">${escapeHtml(ogrenci.okul ?? "Okul belirtilmemiş")}</p>
          <div class="eslesme-kart__alanlar">
            <span class="eslesme-kart__etiket-baslik">Ortak ilgi alanları</span>
            <div class="etiket-listesi">
              ${
                ortakAlanlar.length
                  ? ortakAlanlar
                      .map((a) => `<span class="etiket">${escapeHtml(a)}</span>`)
                      .join("")
                  : `<span class="muted">Ortak alan yok</span>`
              }
            </div>
          </div>
          <button type="button" class="btn-tanis" data-hedef-id="${ogrenci.id}">
            Tanış
          </button>
        </article>
      `
      )
      .join("");

    container.innerHTML = `
      <section class="oneriler">
        <h2>Senin için öneriler</h2>
        <div class="eslesme-kartlari">${kartlar}</div>
      </section>
    `;

    container.querySelectorAll(".btn-tanis").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hedefId = btn.dataset.hedefId;
        window.dispatchEvent(
          new CustomEvent("tetz:tanis", {
            detail: { ogrenciId, hedefId }
          })
        );
      });
    });
  } catch (err) {
    console.error("Öneriler yüklenemedi:", err);
    container.innerHTML = `<p class="muted">Öneriler yüklenirken bir hata oluştu.</p>`;
  }
}
