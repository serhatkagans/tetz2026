/**
 * ============================================================
 * app.js — Ana uygulama
 * ============================================================
 *
 * Sayfa açılınca sırasıyla şunlar olur:
 *   1. Kategori listesi yüklenir
 *   2. Firebase'e anonim giriş yapılır
 *   3. Fuar kat planı çizilir (map.js)
 *   4. Öğrenci ve eşleşme sayıları canlı güncellenir
 */

import { FuarKatPlani } from "./components/map.js";

const { db, auth, firestore, authApi } = window.tetz;
const { collection, onSnapshot } = firestore;
const { signInAnonymously, onAuthStateChanged } = authApi;

// ── Uygulama durumu ────────────────────────────────────────

const durum = {
  kullanici: null,
  kategoriler: [],
  ogrenciler: [],
  eslesmeler: []
};

// ── HTML elemanları ────────────────────────────────────────

const elemanlar = {
  harita: document.getElementById("map-container"),
  bilgi: document.getElementById("content-area"),
  istatistik: document.getElementById("stats-bar")
};

// ── Veri yükleme ───────────────────────────────────────────

async function kategorileriYukle() {
  const yollar = ["data/categories.json", "../data/categories.json"];
  for (const yol of yollar) {
    try {
      const cevap = await fetch(yol);
      if (cevap.ok) return cevap.json();
    } catch {
      /* sonraki yolu dene */
    }
  }
  throw new Error("Kategori listesi yüklenemedi");
}

// ── Ekrana yazma ───────────────────────────────────────────

function istatistikleriGuncelle() {
  const toplam = durum.ogrenciler.length;
  const onayli = durum.ogrenciler.filter(o => o.onaylandi).length;
  const eslesme = durum.eslesmeler.length;

  elemanlar.istatistik.innerHTML = `
    <span><strong>${toplam}</strong> kayıtlı öğrenci</span>
    <span><strong>${onayli}</strong> onaylı öğrenci</span>
    <span><strong>${eslesme}</strong> eşleşme</span>
    <span><strong>${durum.kategoriler.length}</strong> ilgi alanı</span>
  `;
}

async function haritayiCiz() {
  await FuarKatPlani("map-container");
}

// ── Firestore dinleyicileri (canlı güncelleme) ─────────────

function ogrencileriDinle() {
  return onSnapshot(collection(db, "students"), anlik => {
    durum.ogrenciler = anlik.docs.map(b => ({ id: b.id, ...b.data() }));
    istatistikleriGuncelle();
  });
}

function eslesmeleriDinle() {
  return onSnapshot(collection(db, "matches"), anlik => {
    durum.eslesmeler = anlik.docs.map(b => ({ id: b.id, ...b.data() }));
    istatistikleriGuncelle();
  });
}

// ── Başlat ─────────────────────────────────────────────────

async function baslat() {
  // 1) Kategorileri yükle
  try {
    durum.kategoriler = await kategorileriYukle();
  } catch (hata) {
    console.error("Kategori hatası:", hata);
    durum.kategoriler = [];
  }

  // 2) Firebase girişi ve canlı veri dinleme
  onAuthStateChanged(auth, kullanici => {
    durum.kullanici = kullanici;

    if (!kullanici) {
      signInAnonymously(auth).catch(hata =>
        console.error("Giriş hatası:", hata)
      );
      return;
    }

    ogrencileriDinle();
    eslesmeleriDinle();
  });

  // 3) Haritayı çiz
  try {
    await haritayiCiz();
  } catch (hata) {
    console.error("Harita hatası:", hata);
    if (elemanlar.harita) {
      elemanlar.harita.innerHTML = `
        <div class="hata-mesaji">
          <p><strong>Harita yüklenemedi</strong></p>
          <p>${hata.message || "Bilinmeyen hata"}</p>
          <p class="hata-mesaji__ipucu">
            index.html dosyasını doğrudan açma — bir sunucu üzerinden aç:
            <code>firebase serve</code> veya VS Code Live Server
          </p>
        </div>
      `;
    }
  }

  // 4) İlk istatistikleri göster
  istatistikleriGuncelle();
}

baslat();

export { durum as state, db, auth };
