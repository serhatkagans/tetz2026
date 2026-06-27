const SINIFLAR = [9, 10, 11, 12];

const DEFAULT_FILTERS = {
  ilgiAlanlari: [],
  sinif: null,
  arama: ""
};

const STYLE_ID = "tetz-filters-styles";

async function loadCategories() {
  const paths = ["data/categories.json", "../data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return res.json();
    } catch {
      // sonraki yolu dene
    }
  }
  throw new Error("categories.json yüklenemedi");
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .tetz-filters {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tetz-filters__label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted, #9aa1ad);
      margin-bottom: 8px;
    }

    .tetz-filters__search-input {
      width: 100%;
    }

    .tetz-filters__btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tetz-filters__sinif-btn {
      min-width: 44px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--border, #2a2f3a);
      background: var(--surface-2, #1f232c);
      color: var(--text, #e6e8ee);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, transform 0.1s;
    }

    .tetz-filters__sinif-btn:hover {
      border-color: var(--primary, #4f8cff);
    }

    .tetz-filters__sinif-btn--active {
      background: var(--primary, #4f8cff);
      border-color: var(--primary, #4f8cff);
      color: #fff;
    }

    .tetz-filters__category-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 2px solid var(--cat-color, #4f8cff);
      background: color-mix(in srgb, var(--cat-color, #4f8cff) 12%, transparent);
      color: var(--text, #e6e8ee);
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      line-height: 1.2;
    }

    .tetz-filters__category-btn:hover {
      background: color-mix(in srgb, var(--cat-color, #4f8cff) 22%, transparent);
    }

    .tetz-filters__category-btn--active {
      background: var(--cat-color, #4f8cff);
      color: #fff;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--cat-color, #4f8cff) 35%, transparent);
    }

    .tetz-filters__category-icon {
      font-size: 15px;
      line-height: 1;
    }

    .tetz-filters__footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 4px;
      border-top: 1px solid var(--border, #2a2f3a);
    }

    .tetz-filters__count {
      font-size: 14px;
      color: var(--text-muted, #9aa1ad);
    }

    .tetz-filters__count strong {
      color: var(--text, #e6e8ee);
      font-weight: 600;
    }

    .tetz-filters__clear-btn {
      background: transparent;
      border: 1px solid var(--border, #2a2f3a);
      color: var(--text-muted, #9aa1ad);
      padding: 7px 12px;
      font-size: 13px;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }

    .tetz-filters__clear-btn:hover {
      border-color: var(--accent, #ff6b9a);
      color: var(--accent, #ff6b9a);
      background: transparent;
    }

    @media (max-width: 480px) {
      .tetz-filters__category-btn {
        font-size: 12px;
        padding: 6px 10px;
      }

      .tetz-filters__footer {
        flex-direction: column;
        align-items: stretch;
      }

      .tetz-filters__clear-btn {
        width: 100%;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);
}

function normalizeText(value) {
  return String(value ?? "").toLocaleLowerCase("tr-TR").trim();
}

function getStudentName(student) {
  return student.ad || student.isim || student.name || "";
}

function getStudentSchool(student) {
  return student.okul || student.school || "";
}

/**
 * Önceden çekilmiş öğrenci listesini istemci tarafında filtreler.
 * Firestore sorgusu atmaz.
 */
export function applyFilters(students, filters) {
  const { ilgiAlanlari = [], sinif = null, arama = "" } = filters ?? DEFAULT_FILTERS;
  let result = students;

  if (ilgiAlanlari.length > 0) {
    result = result.filter((student) => {
      const areas = student.ilgiAlanlari || [];
      return ilgiAlanlari.some((id) => areas.includes(id));
    });
  }

  if (sinif != null) {
    result = result.filter((student) => Number(student.sinif) === Number(sinif));
  }

  const query = normalizeText(arama);
  if (query) {
    result = result.filter((student) => {
      const ad = normalizeText(getStudentName(student));
      const okul = normalizeText(getStudentSchool(student));
      return ad.includes(query) || okul.includes(query);
    });
  }

  return result;
}

function formatCount(count) {
  return `${count} öğrenci bulundu`;
}

/**
 * Filtre arayüzünü oluşturur ve filtre değişimlerinde onFilterChange çağırır.
 * @param {string} containerId - Filtrelerin render edileceği element id'si
 * @param {(filters: { ilgiAlanlari: string[], sinif: number|null, arama: string }) => void} onFilterChange
 * @returns {Promise<{ updateResultCount: (count: number) => void, getFilters: () => object }>}
 */
export async function initFilters(containerId, onFilterChange) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Filtre konteyneri bulunamadı: #${containerId}`);
  }

  injectStyles();

  const categories = await loadCategories();
  const filters = { ...DEFAULT_FILTERS, ilgiAlanlari: [] };

  container.innerHTML = `
    <div class="tetz-filters" data-tetz-filters>
      <div class="tetz-filters__section">
        <label class="tetz-filters__label" for="${containerId}-arama">Arama</label>
        <input
          id="${containerId}-arama"
          class="tetz-filters__search-input"
          type="search"
          placeholder="Ad veya okul ara..."
          autocomplete="off"
          aria-label="Öğrenci adı veya okul ara"
        />
      </div>

      <div class="tetz-filters__section">
        <span class="tetz-filters__label">Sınıf</span>
        <div class="tetz-filters__btn-row" data-sinif-group role="group" aria-label="Sınıf filtresi">
          ${SINIFLAR.map(
            (sinif) =>
              `<button type="button" class="tetz-filters__sinif-btn" data-sinif="${sinif}" aria-pressed="false">${sinif}</button>`
          ).join("")}
        </div>
      </div>

      <div class="tetz-filters__section">
        <span class="tetz-filters__label">İlgi Alanları</span>
        <div class="tetz-filters__btn-row" data-category-group role="group" aria-label="İlgi alanı filtresi">
          ${categories
            .map(
              (cat) => `
            <button
              type="button"
              class="tetz-filters__category-btn"
              data-category-id="${cat.id}"
              style="--cat-color: ${cat.color}"
              aria-pressed="false"
            >
              <span class="tetz-filters__category-icon" aria-hidden="true">${cat.icon}</span>
              <span>${cat.name}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>

      <div class="tetz-filters__footer">
        <p class="tetz-filters__count" data-result-count aria-live="polite">${formatCount(0)}</p>
        <button type="button" class="tetz-filters__clear-btn" data-clear-filters>Filtreleri Temizle</button>
      </div>
    </div>
  `;

  const root = container.querySelector("[data-tetz-filters]");
  const searchInput = root.querySelector(`#${containerId}-arama`);
  const countEl = root.querySelector("[data-result-count]");
  const sinifButtons = [...root.querySelectorAll("[data-sinif]")];
  const categoryButtons = [...root.querySelectorAll("[data-category-id]")];
  const clearBtn = root.querySelector("[data-clear-filters]");

  function syncUI() {
    sinifButtons.forEach((btn) => {
      const active = Number(btn.dataset.sinif) === filters.sinif;
      btn.classList.toggle("tetz-filters__sinif-btn--active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    categoryButtons.forEach((btn) => {
      const active = filters.ilgiAlanlari.includes(btn.dataset.categoryId);
      btn.classList.toggle("tetz-filters__category-btn--active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    searchInput.value = filters.arama;
  }

  function emitChange() {
    onFilterChange({
      ilgiAlanlari: [...filters.ilgiAlanlari],
      sinif: filters.sinif,
      arama: filters.arama
    });
  }

  function updateResultCount(count) {
    countEl.textContent = formatCount(count);
  }

  searchInput.addEventListener("input", () => {
    filters.arama = searchInput.value;
    emitChange();
  });

  sinifButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sinif = Number(btn.dataset.sinif);
      filters.sinif = filters.sinif === sinif ? null : sinif;
      syncUI();
      emitChange();
    });
  });

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.categoryId;
      const index = filters.ilgiAlanlari.indexOf(id);
      if (index === -1) {
        filters.ilgiAlanlari.push(id);
      } else {
        filters.ilgiAlanlari.splice(index, 1);
      }
      syncUI();
      emitChange();
    });
  });

  clearBtn.addEventListener("click", () => {
    filters.ilgiAlanlari = [];
    filters.sinif = null;
    filters.arama = "";
    syncUI();
    emitChange();
  });

  syncUI();
  emitChange();

  return {
    updateResultCount,
    getFilters: () => ({
      ilgiAlanlari: [...filters.ilgiAlanlari],
      sinif: filters.sinif,
      arama: filters.arama
    })
  };
}
