/**
 * ============================================================
 * map.js — Fuar Kat Planı
 * ============================================================
 *
 * Bu dosya ne yapar?
 *   1. İlgi alanı kategorilerini renkli stand kutuları olarak çizer
 *   2. Bir standa tıklanınca Firestore'dan o alandaki öğrencileri çeker
 *   3. Öğrencileri sağ panelde kart olarak listeler
 *
 * Dışarıya verilen fonksiyonlar:
 *   - FuarKatPlani(konteynerId)     → Haritayı oluşturur
 *   - onKategoriSec(kategoriId)     → Seçilen standın öğrencilerini getirir
 *   - renderStandOgrencileri(...)   → Öğrenci kartlarını çizer
 */

function getFirebase() {
  if (!window.tetz?.db) {
    throw new Error("Firebase bağlantısı henüz hazır değil. Sayfayı yenile.");
  }
  return window.tetz;
}

// Bellekte tutulan kategori listesi (tekrar tekrar indirmemek için)
let kategoriler = [];

// Öğrenci listesinin yazılacağı panelin HTML id'si
let panelId = "fuar-stand-panel";

// ── Yardımcı fonksiyonlar ──────────────────────────────────

/** categories.json dosyasını internetten okur */
async function kategorileriYukle() {
  if (kategoriler.length) return kategoriler;

  const yollar = ["data/categories.json", "../data/categories.json"];
  for (const yol of yollar) {
    try {
      const cevap = await fetch(yol);
      if (cevap.ok) {
        kategoriler = await cevap.json();
        return kategoriler;
      }
    } catch {
      // Bu yol çalışmadı, diğerini dene
    }
  }
  throw new Error("Kategori listesi yüklenemedi (categories.json bulunamadı)");
}

/** Kategori id'sinden Türkçe adını bulur */
function kategoriAdiBul(kategoriId) {
  const kategori = kategoriler.find(k => k.id === kategoriId);
  return kategori ? kategori.name : kategoriId;
}

/** Hızlı erişim için id → kategori eşleme tablosu */
function kategoriHaritasi() {
  return Object.fromEntries(kategoriler.map(k => [k.id, k]));
}

/** Metni HTML'e güvenli şekilde yazar (XSS koruması) */
function guvenliMetin(metin) {
  return String(metin)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── 1) Haritayı oluştur ────────────────────────────────────

/**
 * Fuar kat planını ekrana çizer.
 * @param {string} konteynerId — HTML'deki div'in id'si (ör. "map-container")
 * @param {object} [secenekler]
 * @param {string} [secenekler.panelId] — Öğrenci panelinin id'si
 */
async function FuarKatPlani(konteynerId, secenekler = {}) {
  const konteyner = document.getElementById(konteynerId);
  if (!konteyner) {
    throw new Error(`Harita alanı bulunamadı: #${konteynerId}`);
  }

  panelId = secenekler.panelId || "fuar-stand-panel";
  const liste = await kategorileriYukle();

  konteyner.innerHTML = `
    <div class="fuar-kat-plani">
      <div class="fuar-kat-plani__header">
        <h2>Fuar Kat Planı</h2>
        <p>Bir ilgi alanı standına tıkla — o alandaki öğrenciler sağda listelenir</p>
      </div>
      <div class="fuar-kat-plani__body">

        <!-- Stand ızgarası -->
        <div class="fuar-grid" role="list" aria-label="İlgi alanı standları">
          ${liste.map(kat => `
            <button
              type="button"
              class="fuar-stand"
              role="listitem"
              data-kategori-id="${kat.id}"
              style="background-color: ${kat.color}"
              aria-label="${kat.name} standı"
            >
              <span class="fuar-stand__icon" aria-hidden="true">${kat.icon}</span>
              <span class="fuar-stand__name">${kat.name}</span>
              <span class="fuar-stand__hover">Bu standa git</span>
            </button>
          `).join("")}
        </div>

        <!-- Öğrenci paneli -->
        <aside class="fuar-panel">
          <div class="fuar-panel__baslik">
            <h3>Öğrenci Listesi</h3>
            <p>Henüz stand seçilmedi</p>
          </div>
          <div id="${panelId}" class="fuar-panel__icerik">
            <p class="fuar-panel__mesaj">Soldan bir stand seçerek öğrencileri görüntüleyebilirsin.</p>
          </div>
        </aside>

      </div>
    </div>
  `;

  // Her standa tıklama olayı ekle
  konteyner.querySelectorAll(".fuar-stand").forEach(stand => {
    stand.addEventListener("click", () => {
      // Önceki seçimi kaldır, yenisini işaretle
      konteyner.querySelectorAll(".fuar-stand--secili").forEach(el => {
        el.classList.remove("fuar-stand--secili");
      });
      stand.classList.add("fuar-stand--secili");

      onKategoriSec(stand.dataset.kategoriId);
    });
  });
}

// ── 2) Stand seçilince öğrencileri getir ───────────────────

/**
 * Seçilen kategorideki onaylı öğrencileri Firestore'dan çeker.
 * @param {string} kategoriId
 */
async function onKategoriSec(kategoriId) {
  const panel = document.getElementById(panelId);
  const baslikAciklama = document.querySelector(".fuar-panel__baslik p");
  const ad = kategoriAdiBul(kategoriId);

  if (baslikAciklama) {
    baslikAciklama.textContent = `${ad} standı seçildi`;
  }

  if (panel) {
    panel.innerHTML = `<p class="fuar-panel__mesaj">Öğrenciler yükleniyor…</p>`;
  }

  try {
    if (!kategoriler.length) await kategorileriYukle();

    const { db, firestore } = getFirebase();
    const { collection, query, where, getDocs } = firestore;

    const sorgu = query(
      collection(db, "students"),
      where("ilgiAlanlari", "array-contains", kategoriId),
      where("onaylandi", "==", true)
    );

    const sonuc = await getDocs(sorgu);
    const ogrenciler = sonuc.docs.map(belge => ({
      id: belge.id,
      ...belge.data()
    }));

    renderStandOgrencileri(panelId, ogrenciler, ad);
  } catch (hata) {
    console.error("Öğrenci listesi alınamadı:", hata);
    if (panel) {
      panel.innerHTML = `<p class="fuar-panel__mesaj">Öğrenciler yüklenirken bir hata oluştu. Sayfayı yenilemeyi dene.</p>`;
    }
  }
}

// ── 3) Öğrenci kartlarını çiz ──────────────────────────────

/**
 * Öğrencileri kart olarak listeler.
 * @param {string} konteynerId
 * @param {Array} ogrenciler
 * @param {string} [kategoriAdi]
 */
function renderStandOgrencileri(konteynerId, ogrenciler, kategoriAdi = "") {
  const konteyner = document.getElementById(konteynerId);
  if (!konteyner) return;

  // Stand boşsa
  if (!ogrenciler.length) {
    konteyner.innerHTML = `
      <div class="ogrenci-kartlari ogrenci-kartlari--bos">
        Bu standda henüz kayıtlı öğrenci yok.
      </div>
    `;
    return;
  }

  const harita = kategoriHaritasi();

  konteyner.innerHTML = `
    <div class="ogrenci-kartlari" role="list"
         aria-label="${kategoriAdi ? kategoriAdi + ' standı öğrencileri' : 'Stand öğrencileri'}">
      ${ogrenciler.map(ogr => {
        const ilgiler = (ogr.ilgiAlanlari || [])
          .map(id => harita[id]?.name || kategoriAdiBul(id))
          .filter(Boolean);

        return `
          <article class="ogrenci-kart" role="listitem">
            <div class="ogrenci-kart__ad">${guvenliMetin(ogr.ad || "İsimsiz Öğrenci")}</div>
            <div class="ogrenci-kart__bilgi">${guvenliMetin(ogr.okul || "Okul belirtilmemiş")}</div>
            <div class="ogrenci-kart__bilgi">${guvenliMetin(ogr.sinif ? `${ogr.sinif}. sınıf` : "Sınıf belirtilmemiş")}</div>
            ${ilgiler.length ? `
              <div class="ogrenci-kart__ilgiler">
                ${ilgiler.map(ilgi => `<span class="ogrenci-kart__etiket">${guvenliMetin(ilgi)}</span>`).join("")}
              </div>
            ` : ""}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

export { FuarKatPlani, onKategoriSec, renderStandOgrencileri };
