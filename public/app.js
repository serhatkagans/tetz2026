import { renderStats as renderStatsCards } from "./components/stats.js";

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

function renderContent() {
  els.content.innerHTML = `
    <section class="welcome">
      <h2>Hoş geldin!</h2>
      <p>İlgi alanlarına göre seni başka öğrencilerle eşleştireceğiz.</p>
      <p class="muted">Kategori sayısı: ${state.categories.length}</p>
    </section>
  `;
}

function renderMap() {
  els.map.innerHTML = `<div class="map-placeholder">Harita alanı</div>`;
}

function subscribeStudents() {
  return onSnapshot(collection(db, "students"), snap => {
    state.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
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

  onAuthStateChanged(auth, user => {
    state.user = user;
    if (!user) {
      signInAnonymously(auth).catch(err => console.error("Anonim giriş hatası:", err));
      return;
    }
    subscribeStudents();
    subscribeMatches();
  });

  renderMap();
  renderContent();
  renderStats();
}

init();

export { state, db, auth };
