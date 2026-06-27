import { renderOneriler, eslesmeleriKaydet } from "./components/matching.js";
import { FuarKatPlani } from "./components/map.js";
import { renderStats as renderStatsCards } from "./components/stats.js";
import { renderModerasyon } from "./components/moderation.js";

const { db, auth, firestore, authApi } = window.tetz;
const {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, onSnapshot, serverTimestamp
} = firestore;
const { signInAnonymously, onAuthStateChanged } = authApi;

const state = {
  user: null,
  categories: [],
  students: [],
  matches: []
};

const els = {
  app: document.getElementById("app"),
  map: document.getElementById("map-container"),
  content: document.getElementById("content-area"),
  stats: document.getElementById("stats-bar")
};

async function loadCategories() {
  const res = await fetch("../data/categories.json");
  if (!res.ok) {
    const local = await fetch("data/categories.json").catch(() => null);
    if (local && local.ok) return local.json();
    throw new Error("categories.json yüklenemedi");
  }
  return res.json();
}

function renderStats() {
  renderStatsCards("stats-container");
}

function getCurrentOgrenciId() {
  if (!state.user) return null;
  const ogrenci = state.students.find((s) => s.id === state.user.uid);
  return ogrenci?.id ?? null;
}

let onerilerYuklendi = false;

async function showOneriler(ogrenciId) {
  if (!ogrenciId || onerilerYuklendi) return;
  onerilerYuklendi = true;
  try {
    await eslesmeleriKaydet(ogrenciId);
    await renderOneriler("content-area", ogrenciId);
  } catch (err) {
    onerilerYuklendi = false;
    console.error("Eşleşme önerileri yüklenemedi:", err);
  }
}

function maybeShowOneriler() {
  const ogrenciId = getCurrentOgrenciId();
  if (ogrenciId) showOneriler(ogrenciId);
}

function renderContent() {
  if (getCurrentOgrenciId()) return;
  els.content.innerHTML = `
    <section class="welcome">
      <h2>Hoş geldin!</h2>
      <p>İlgi alanlarına göre seni başka öğrencilerle eşleştireceğiz.</p>
      <p class="muted">Kategori sayısı: ${state.categories.length}</p>
    </section>
  `;
}

async function renderMap() {
  try {
    await FuarKatPlani("map-container");
  } catch (err) {
    console.error("Harita hatası:", err);
    if (els.map) {
      els.map.innerHTML = `
        <div class="hata-mesaji">
          <p><strong>Harita yüklenemedi</strong></p>
          <p>${err.message || "Bilinmeyen hata"}</p>
          <p class="hata-mesaji__ipucu">
            index.html dosyasını doğrudan açma — bir sunucu üzerinden aç:
            <code>firebase serve</code> veya VS Code Live Server
          </p>
        </div>
      `;
    }
  }
}

function subscribeStudents() {
  return onSnapshot(collection(db, "students"), snap => {
    state.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
    maybeShowOneriler();
  });
}

function subscribeMatches() {
  return onSnapshot(collection(db, "matches"), snap => {
    state.matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
  });
}

// Router ve navigasyon yönetimi
function handleRoute() {
  const modBtn = document.getElementById("nav-btn-mod");
  if (window.location.hash === "#moderasyon") {
    if (modBtn) modBtn.textContent = "Ana Sayfa";
    renderModerasyon("content-area");
  } else {
    if (modBtn) modBtn.textContent = "Moderatör Paneli";
    renderContent();
  }
}

window.addEventListener("hashchange", handleRoute);

// Header'a navigasyon butonunun eklenmesi
function setupNavigation() {
  const header = document.getElementById("app-header");
  if (header) {
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const navDiv = document.createElement("div");
    navDiv.innerHTML = `
      <button id="nav-btn-mod" style="background: var(--surface-2); border: 1px solid var(--border); color: var(--text);">Moderatör Paneli</button>
    `;
    header.appendChild(navDiv);

    const modBtn = navDiv.querySelector("#nav-btn-mod");
    modBtn.addEventListener("click", () => {
      if (window.location.hash === "#moderasyon") {
        window.location.hash = "";
      } else {
        window.location.hash = "#moderasyon";
      }
    });
  }
}

async function init() {
  setupNavigation();

  try {
    state.categories = await loadCategories();
  } catch (err) {
    console.error(err);
    state.categories = [];
  }

  window.addEventListener("tetz:tanis", (event) => {
    const { ogrenciId, hedefId } = event.detail ?? {};
    console.info("Tanış isteği:", { ogrenciId, hedefId });
  });

  onAuthStateChanged(auth, user => {
    state.user = user;
    if (!user) {
      signInAnonymously(auth).catch(err => console.error("Anonim giriş hatası:", err));
      return;
    }
    subscribeStudents();
    subscribeMatches();
    maybeShowOneriler();
  });

  await renderMap();
  handleRoute();
  renderStats();
}

init();

export { state, db, auth };
