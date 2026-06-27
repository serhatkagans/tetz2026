import { renderOneriler, eslesmeleriKaydet } from "./components/matching.js";
import { FuarKatPlani } from "./components/map.js";

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
  const total = state.students.length;
  const approved = state.students.filter(s => s.onaylandi).length;
  const matchCount = state.matches.length;
  els.stats.innerHTML = `
    <span><strong>${total}</strong> öğrenci</span>
    <span><strong>${approved}</strong> onaylı</span>
    <span><strong>${matchCount}</strong> eşleşme</span>
    <span><strong>${state.categories.length}</strong> ilgi alanı</span>
  `;
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

async function init() {
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
  renderContent();
  renderStats();
}

init();

export { state, db, auth };
