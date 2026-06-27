// TETZ2026 Vibe Coding Kampi - EKIP 2
// Profil & Ilgi Alani Yonetimi Bileşeni

function injectStyles() {
  if (document.getElementById("tetz-profile-styles")) return;

  const styleEl = document.createElement("style");
  styleEl.id = "tetz-profile-styles";
  styleEl.textContent = `
    .profile-component {
      background: rgba(24, 27, 34, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 28px;
      color: #e6e8ee;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 650px;
      margin: 0 auto;
      box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
      animation: tetzProfileFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes tetzProfileFadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .profile-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 24px;
      margin-bottom: 24px;
    }

    .profile-avatar-wrapper {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .profile-avatar {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      background: linear-gradient(135deg, #7c5cff, #ff6b9a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #fff;
      box-shadow: 0 8px 20px rgba(124, 92, 255, 0.35);
      user-select: none;
    }

    .profile-info h3 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #ffffff, #e6e8ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .profile-meta {
      font-size: 13.5px;
      color: #9aa1ad;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .profile-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .profile-section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8a92a6;
      margin: 0 0 16px 0;
    }

    .interests-container {
      margin-bottom: 32px;
    }

    .interests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
      gap: 12px;
    }

    .interest-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      font-size: 13.5px;
      font-weight: 500;
    }

    .interest-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .interest-chip.selected {
      background: var(--chip-bg);
      border-color: var(--chip-border);
      box-shadow: 0 6px 16px var(--chip-shadow);
      color: #fff;
    }

    .interest-chip-icon {
      font-size: 16px;
    }

    /* Modern Toggle Switch CSS */
    .toggle-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 18px;
      border-radius: 16px;
      margin-bottom: 32px;
      transition: background 0.2s ease;
    }

    .toggle-wrapper:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-right: 12px;
    }

    .toggle-label {
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
    }

    .toggle-desc {
      font-size: 12px;
      color: #9aa1ad;
      line-height: 1.4;
    }

    .tetz-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 30px;
      flex-shrink: 0;
    }

    .tetz-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .tetz-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.14);
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 34px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tetz-slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    }

    .tetz-switch input:checked + .tetz-slider {
      background-color: #22c55e;
    }

    .tetz-switch input:checked + .tetz-slider:before {
      transform: translateX(22px);
    }

    /* Save Button Section */
    .profile-actions {
      display: flex;
      justify-content: flex-end;
    }

    .tetz-save-btn {
      background: linear-gradient(135deg, #4f8cff, #3b82f6);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 14.5px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(79, 140, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tetz-save-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(79, 140, 255, 0.45);
    }

    .tetz-save-btn:active {
      transform: translateY(1px);
    }

    .tetz-save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .tetz-toast {
      position: fixed;
      bottom: 32px;
      right: 32px;
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 14px 28px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(34, 197, 94, 0.35);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tetz-toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .tetz-error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      padding: 16px;
      border-radius: 14px;
      margin-bottom: 24px;
      font-size: 14px;
    }
  `;
  document.head.appendChild(styleEl);
}

// Utility to fetch categories safely
async function fetchCategories() {
  const paths = ["../data/categories.json", "data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch (e) {
      // Try next path
    }
  }
  throw new Error("Categories could not be loaded");
}

// Utility to hex to rgb helper for shadows
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Show a modern notification toast
function showToast(message) {
  let toastEl = document.querySelector(".tetz-toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "tetz-toast";
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = `<span>🎉</span> <span>${message}</span>`;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3500);
}

/**
 * Renders the Profile & Interest Management Component
 * @param {string} containerId - Element ID where the component will be injected
 * @param {string} studentId - Firestore document ID of the student
 */
export async function renderProfile(containerId, studentId) {
  injectStyles();
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found`);
    return;
  }

  // Show Loading Info
  container.innerHTML = `
    <div class="profile-component" style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
      <div style="color: #9aa1ad; font-size: 15px;">Profil yükleniyor...</div>
    </div>
  `;

  try {
    // 1. Resolve Firebase parameters from window.tetz
    if (!window.tetz || !window.tetz.db || !window.tetz.firestore) {
      throw new Error("Firebase is not initialized. Please ensure window.tetz is configured.");
    }
    const { db, firestore } = window.tetz;
    const { doc, getDoc, updateDoc } = firestore;

    // 2. Fetch categories and student profile in parallel
    const [categories, studentSnap] = await Promise.all([
      fetchCategories(),
      getDoc(doc(db, "students", studentId))
    ]);

    if (!studentSnap.exists()) {
      container.innerHTML = `
        <div class="profile-component">
          <div class="tetz-error-message">
            <strong>Hata:</strong> Öğrenci profili bulunamadı (ID: ${studentId}).
          </div>
        </div>
      `;
      return;
    }

    const studentData = studentSnap.data();
    const ad = studentData.ad || "İsimsiz Öğrenci";
    const okul = studentData.okul || "Belirtilmemiş Okul";
    const sinif = studentData.sinif || "Belirtilmemiş Sınıf";
    
    // Normalize interests array
    let selectedInterests = Array.isArray(studentData.ilgiAlanlari) ? [...studentData.ilgiAlanlari] : [];
    let bulusmaKabul = !!studentData.bulusmaKabul;

    // 3. Build UI Layout (ad, okul, sinif are read-only labels as required)
    container.innerHTML = `
      <div class="profile-component">
        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar">${ad.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
              <h3>${ad}</h3>
              <div class="profile-meta">
                <div class="profile-meta-item">🏫 <span>${okul}</span></div>
                <div class="profile-meta-item">🎓 <span>${sinif}. Sınıf</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="interests-container">
          <h4 class="profile-section-title">İlgi Alanları</h4>
          <div class="interests-grid" id="interests-grid-container"></div>
        </div>

        <div class="toggle-wrapper">
          <div class="toggle-info">
            <span class="toggle-label">Beni eslestir</span>
            <span class="toggle-desc">Diğer öğrencilerin seninle networking amaçlı buluşma talep etmesine izin ver.</span>
          </div>
          <label class="tetz-switch">
            <input type="checkbox" id="bulusma-kabul-toggle" ${bulusmaKabul ? "checked" : ""}>
            <span class="tetz-slider"></span>
          </label>
        </div>

        <div class="profile-actions">
          <button class="tetz-save-btn" id="profile-save-btn">
            <span>💾</span>
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    `;

    // 4. Render Interest Chips using color from categories.json
    const gridContainer = document.getElementById("interests-grid-container");
    categories.forEach(cat => {
      const isSelected = selectedInterests.includes(cat.id);
      const chip = document.createElement("div");
      chip.className = `interest-chip ${isSelected ? "selected" : ""}`;
      chip.dataset.id = cat.id;

      // Hex to RGB conversion for custom shadows and backgrounds
      const rgb = hexToRgb(cat.color || "#4f8cff") || { r: 79, g: 140, b: 255 };
      const cssVars = `
        --chip-color: ${cat.color || "#4f8cff"};
        --chip-bg: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15);
        --chip-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
        --chip-shadow: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2);
      `;
      chip.setAttribute("style", cssVars);

      chip.innerHTML = `
        <span class="interest-chip-icon">${cat.icon || "🌟"}</span>
        <span>${cat.name}</span>
      `;

      // Handle Chip Toggle behavior (click to select/remove)
      chip.addEventListener("click", () => {
        if (selectedInterests.includes(cat.id)) {
          selectedInterests = selectedInterests.filter(id => id !== cat.id);
          chip.classList.remove("selected");
        } else {
          selectedInterests.push(cat.id);
          chip.classList.add("selected");
        }
      });

      gridContainer.appendChild(chip);
    });

    // 5. Save Changes to Firestore
    const saveBtn = document.getElementById("profile-save-btn");
    const toggleInput = document.getElementById("bulusma-kabul-toggle");

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = `<span>⏳</span> <span>Kaydediliyor...</span>`;

      try {
        const studentDocRef = doc(db, "students", studentId);
        await updateDoc(studentDocRef, {
          ilgiAlanlari: selectedInterests,
          bulusmaKabul: toggleInput.checked
        });

        showToast("Degisiklikler kaydedildi");
      } catch (err) {
        console.error("Profil güncellenirken hata oluştu:", err);
        alert(`Profil güncellenirken hata oluştu: ${err.message}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    });

  } catch (err) {
    console.error("Error rendering profile:", err);
    container.innerHTML = `
      <div class="profile-component">
        <div class="tetz-error-message">
          <strong>Sistem Hatası:</strong> Profil yüklenemedi.<br>
          <small style="opacity: 0.8;">${err.message}</small>
        </div>
      </div>
    `;
  }
}
