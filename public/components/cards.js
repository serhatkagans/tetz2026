const { db, firestore } = window.tetz;
const { collection, query, where, getDocs } = firestore;

let categoriesCache = null;
let categoriesById = null;

async function ensureCategories() {
  if (categoriesCache) return categoriesCache;

  const paths = ["../../data/categories.json", "../data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        categoriesCache = await res.json();
        categoriesById = Object.fromEntries(categoriesCache.map(c => [c.id, c]));
        return categoriesCache;
      }
    } catch {
      /* try next path */
    }
  }

  categoriesCache = [];
  categoriesById = {};
  return categoriesCache;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getStudentName(student) {
  if (student.adSoyad) return student.adSoyad;
  const ad = student.ad ?? student.name ?? "";
  const soyad = student.soyad ?? student.surname ?? "";
  return `${ad} ${soyad}`.trim() || "İsimsiz Öğrenci";
}

function getSchoolInfo(student) {
  const okul = student.okul ?? student.school ?? "";
  const sinif = student.sinif ?? student.grade ?? student.class ?? "";
  if (okul && sinif) return `${okul} · ${sinif}. sınıf`;
  if (okul) return okul;
  if (sinif) return `${sinif}. sınıf`;
  return "Okul bilgisi yok";
}

function renderInterestChips(interests) {
  const ids = Array.isArray(interests) ? interests : [];
  if (ids.length === 0) {
    return '<p class="student-card__no-interests">İlgi alanı belirtilmemiş</p>';
  }

  return `<div class="student-card__chips">${ids.map(id => {
    const cat = categoriesById?.[id];
    if (cat) {
      const color = escapeHtml(cat.color);
      return `<span class="interest-chip" style="--chip-color:${color}">
        <span class="interest-chip__icon">${cat.icon}</span>
        ${escapeHtml(cat.name)}
      </span>`;
    }
    return `<span class="interest-chip interest-chip--fallback">${escapeHtml(id)}</span>`;
  }).join("")}</div>`;
}

/**
 * Tek bir öğrenci kartı HTML string'i döndürür.
 * @param {object} student
 * @returns {string}
 */
export function renderStudentCard(student) {
  const name = escapeHtml(getStudentName(student));
  const school = escapeHtml(getSchoolInfo(student));
  const interests = student.ilgiAlanlari ?? student.interests ?? student.kategoriler ?? [];

  return `
    <article class="student-card" data-student-id="${escapeHtml(student.id)}">
      <div class="student-card__body">
        <h3 class="student-card__name">${name}</h3>
        <p class="student-card__school">${school}</p>
        <div class="student-card__interests">
          <span class="student-card__label">İlgi alanları</span>
          ${renderInterestChips(interests)}
        </div>
      </div>
      <footer class="student-card__footer">
        <button type="button" class="student-card__btn" data-tanis data-student-id="${escapeHtml(student.id)}">
          Tanış
        </button>
      </footer>
    </article>
  `;
}

/**
 * Firestore'dan onaylanmış öğrencileri çeker.
 * @returns {Promise<object[]>}
 */
export async function fetchApprovedStudents() {
  await ensureCategories();

  const q = query(collection(db, "students"), where("onaylandi", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Öğrenci listesini responsive grid içinde render eder.
 * @param {string} containerId
 * @param {object[]} students
 */
export async function renderStudentList(containerId, students) {
  await ensureCategories();

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`renderStudentList: "${containerId}" bulunamadı`);
    return;
  }

  if (!students || students.length === 0) {
    container.innerHTML = `<p class="student-list-empty">Henüz kayıtlı öğrenci yok</p>`;
    return;
  }

  container.innerHTML = `
    <div class="student-grid" role="list">
      ${students.map(renderStudentCard).join("")}
    </div>
  `;

  container.querySelectorAll("[data-tanis]").forEach(btn => {
    btn.addEventListener("click", () => {
      const studentId = btn.dataset.studentId;
      window.dispatchEvent(new CustomEvent("tanisIstegi", { detail: studentId }));
    });
  });
}

ensureCategories().catch(err => console.error("Kategoriler yüklenemedi:", err));
