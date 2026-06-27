const { db, firestore } = window.tetz;
const { collection, getDocs, query, where } = firestore;

let categoriesCache = null;

function ensureStyles() {
  if (document.getElementById("student-card-styles")) return;

  const style = document.createElement("style");
  style.id = "student-card-styles";
  style.textContent = `
    .student-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .student-list-empty {
      color: var(--text-muted, #9aa1ad);
      font-size: 14px;
      text-align: center;
      padding: 32px 16px;
    }

    .student-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      border: 1px solid var(--border, #2a2f3a);
      border-radius: var(--radius, 10px);
      background: var(--surface-2, #1f232c);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .student-card:hover {
      transform: translateY(-3px);
      border-color: var(--primary, #4f8cff);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
    }

    .student-card__name {
      font-size: 18px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--text, #e6e8ee);
    }

    .student-card__school {
      font-size: 14px;
      color: var(--text-muted, #9aa1ad);
    }

    .student-card__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .student-card__chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      line-height: 1.4;
    }

    .student-card__chip-icon {
      font-size: 13px;
      line-height: 1;
    }

    .student-card__actions {
      margin-top: auto;
      padding-top: 4px;
    }

    .student-card__btn {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      background: var(--primary, #4f8cff);
      color: #fff;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.15s ease;
    }

    .student-card__btn:hover {
      background: var(--primary-hover, #6aa0ff);
    }

    .student-card__btn:active {
      transform: scale(0.98);
    }

    @media (max-width: 480px) {
      .student-list {
        grid-template-columns: 1fr;
      }

      .student-card {
        padding: 16px;
      }

      .student-card__name {
        font-size: 17px;
      }
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(text) {
  const el = document.createElement("div");
  el.textContent = text ?? "";
  return el.innerHTML;
}

async function loadCategories() {
  if (categoriesCache) return categoriesCache;

  const paths = ["../data/categories.json", "data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        categoriesCache = await res.json();
        return categoriesCache;
      }
    } catch {
      // Sonraki yolu dene
    }
  }

  categoriesCache = [];
  return categoriesCache;
}

function getStudentName(student) {
  if (student.adSoyad) return student.adSoyad;
  if (student.ad && student.soyad) return `${student.ad} ${student.soyad}`;
  return student.ad || student.isim || student.name || "İsimsiz öğrenci";
}

function getStudentSchoolLine(student) {
  const okul = student.okul || student.school || "";
  const sinif = student.sinif || student.class || student.grade || "";

  if (okul && sinif) return `${okul} · ${sinif}. sınıf`;
  if (okul) return okul;
  if (sinif) return `${sinif}. sınıf`;
  return "Okul bilgisi yok";
}

function getInterestIds(student) {
  const raw =
    student.ilgiAlanlari ||
    student.ilgiler ||
    student.interests ||
    student.kategoriler ||
    [];

  return Array.isArray(raw) ? raw : [];
}

function renderInterestChips(interestIds, categories) {
  if (!interestIds.length) {
    return `<span class="student-card__school">İlgi alanı belirtilmemiş</span>`;
  }

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

  return interestIds
    .map((id) => {
      const cat = categoryMap.get(id);
      const name = cat?.name || id;
      const icon = cat?.icon || "🏷️";
      const color = cat?.color || "#64748B";

      return `
        <span class="student-card__chip" style="background-color: ${escapeHtml(color)}">
          <span class="student-card__chip-icon" aria-hidden="true">${icon}</span>
          ${escapeHtml(name)}
        </span>
      `;
    })
    .join("");
}

export function renderStudentCard(student, categories = categoriesCache) {
  ensureStyles();

  const name = escapeHtml(getStudentName(student));
  const schoolLine = escapeHtml(getStudentSchoolLine(student));
  const studentId = escapeHtml(student.id ?? "");

  const chipsHtml = categories
    ? renderInterestChips(getInterestIds(student), categories)
    : `<span class="student-card__school">İlgi alanı belirtilmemiş</span>`;

  return `
    <article class="student-card" data-student-id="${studentId}">
      <h3 class="student-card__name">${name}</h3>
      <p class="student-card__school">${schoolLine}</p>
      <div class="student-card__chips">${chipsHtml}</div>
      <div class="student-card__actions">
        <button type="button" class="student-card__btn" data-tanis-id="${studentId}">
          Tanış
        </button>
      </div>
    </article>
  `;
}

export async function fetchApprovedStudents() {
  const q = query(
    collection(db, "students"),
    where("onaylandi", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function renderStudentList(containerId, students) {
  ensureStyles();
  await loadCategories();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Konteyner bulunamadı: #${containerId}`);
    return;
  }

  if (!students || students.length === 0) {
    container.innerHTML =
      `<p class="student-list-empty">Henüz kayıtlı öğrenci yok</p>`;
    return;
  }

  container.innerHTML = `
    <div class="student-list">
      ${students.map((student) => renderStudentCard(student)).join("")}
    </div>
  `;

  container.querySelectorAll("[data-tanis-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const studentId = button.dataset.tanisId;
      window.dispatchEvent(
        new CustomEvent("tanisIstegi", { detail: studentId })
      );
    });
  });
}
