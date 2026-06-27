const { db, firestore } = window.tetz;
const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} = firestore;

const subscriptions = new Map();

function ensureStyles() {
  if (document.getElementById("meeting-styles")) return;

  const style = document.createElement("style");
  style.id = "meeting-styles";
  style.textContent = `
    .meeting-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .meeting-title {
      font-size: 16px;
      font-weight: 600;
    }

    .meeting-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .meeting-item {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      border: 1px solid var(--border, #2a2f3a);
      border-radius: 10px;
      background: var(--surface-2, #1f232c);
    }

    .meeting-sender {
      font-size: 15px;
      font-weight: 500;
    }

    .meeting-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .meeting-btn {
      flex: 1;
      min-width: 100px;
    }

    .meeting-btn--accept {
      background: #22c55e;
    }

    .meeting-btn--accept:hover {
      background: #16a34a;
    }

    .meeting-btn--reject {
      background: #ef4444;
    }

    .meeting-btn--reject:hover {
      background: #dc2626;
    }

    .meeting-empty,
    .meeting-loading {
      color: var(--text-muted, #9aa1ad);
      font-size: 14px;
    }

    .meeting-toast {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%) translateY(16px);
      max-width: min(92vw, 420px);
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .meeting-toast--visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .meeting-toast--info {
      background: #1f232c;
      color: #e6e8ee;
      border: 1px solid #2a2f3a;
    }

    .meeting-toast--success {
      background: #14532d;
      color: #dcfce7;
      border: 1px solid #166534;
    }

    .meeting-toast--warning {
      background: #713f12;
      color: #fef3c7;
      border: 1px solid #92400e;
    }

    @media (min-width: 520px) {
      .meeting-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .meeting-actions {
        flex: 0 0 auto;
      }

      .meeting-btn {
        flex: 0 0 auto;
        min-width: 88px;
      }
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(text) {
  const el = document.createElement("div");
  el.textContent = text;
  return el.innerHTML;
}

function showMessage(message, type = "info") {
  ensureStyles();

  const toast = document.createElement("div");
  toast.className = `meeting-toast meeting-toast--${type}`;
  toast.textContent = message;
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("meeting-toast--visible"));

  setTimeout(() => {
    toast.classList.remove("meeting-toast--visible");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

async function getStudentName(studentId) {
  const snap = await getDoc(doc(db, "students", studentId));
  if (!snap.exists()) return "Bilinmeyen öğrenci";

  const data = snap.data();
  return data.ad || data.isim || data.name || "Bilinmeyen öğrenci";
}

async function bekleyenTalepVarMi(gonderenId, aliciId) {
  const meetingsRef = collection(db, "meetings");

  const [gonderilen, gelen] = await Promise.all([
    getDocs(
      query(
        meetingsRef,
        where("gonderenId", "==", gonderenId),
        where("aliciId", "==", aliciId),
        where("durum", "==", "bekliyor")
      )
    ),
    getDocs(
      query(
        meetingsRef,
        where("gonderenId", "==", aliciId),
        where("aliciId", "==", gonderenId),
        where("durum", "==", "bekliyor")
      )
    )
  ]);

  return !gonderilen.empty || !gelen.empty;
}

export function initMeetingSystem(gonderenId) {
  ensureStyles();

  window.addEventListener("tanisisitegi", (event) => {
    const aliciId = event.detail;
    if (!aliciId) return;
    talepGonder(gonderenId, aliciId);
  });
}

export async function talepGonder(gonderenId, aliciId) {
  if (!gonderenId || !aliciId) return;

  if (gonderenId === aliciId) {
    showMessage("Kendinize buluşma talebi gönderemezsiniz.", "warning");
    return;
  }

  try {
    const mevcutTalep = await bekleyenTalepVarMi(gonderenId, aliciId);
    if (mevcutTalep) {
      showMessage("Zaten bir talebiniz var", "warning");
      return;
    }

    await addDoc(collection(db, "meetings"), {
      gonderenId,
      aliciId,
      durum: "bekliyor",
      tarih: serverTimestamp()
    });

    showMessage("Buluşma talebiniz gönderildi", "success");
  } catch (err) {
    console.error("Buluşma talebi gönderilemedi:", err);
    showMessage("Talep gönderilirken bir hata oluştu.", "warning");
  }
}

export async function renderGelenTalepler(containerId, aliciId) {
  ensureStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Konteyner bulunamadı: #${containerId}`);
    return;
  }

  if (subscriptions.has(containerId)) {
    subscriptions.get(containerId)();
    subscriptions.delete(containerId);
  }

  container.innerHTML = `<p class="meeting-loading">Talepler yükleniyor...</p>`;

  const q = query(
    collection(db, "meetings"),
    where("aliciId", "==", aliciId),
    where("durum", "==", "bekliyor")
  );

  const unsubscribe = onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        container.innerHTML =
          `<p class="meeting-empty">Bekleyen buluşma talebiniz yok.</p>`;
        return;
      }

      const items = await Promise.all(
        snap.docs.map(async (meetingDoc) => {
          const data = meetingDoc.data();
          const gonderenAd = await getStudentName(data.gonderenId);
          return { id: meetingDoc.id, gonderenAd };
        })
      );

      container.innerHTML = `
        <section class="meeting-panel">
          <h3 class="meeting-title">Gelen Buluşma Talepleri</h3>
          <ul class="meeting-list">
            ${items
              .map(
                (item) => `
              <li class="meeting-item">
                <span class="meeting-sender">${escapeHtml(item.gonderenAd)}</span>
                <div class="meeting-actions">
                  <button
                    type="button"
                    class="meeting-btn meeting-btn--accept"
                    data-meeting-id="${item.id}"
                    data-karar="kabul"
                  >
                    Kabul
                  </button>
                  <button
                    type="button"
                    class="meeting-btn meeting-btn--reject"
                    data-meeting-id="${item.id}"
                    data-karar="ret"
                  >
                    Ret
                  </button>
                </div>
              </li>
            `
              )
              .join("")}
          </ul>
        </section>
      `;

      container.querySelectorAll("[data-meeting-id]").forEach((button) => {
        button.addEventListener("click", () => {
          talepYanitla(button.dataset.meetingId, button.dataset.karar);
        });
      });
    },
    (err) => {
      console.error("Talepler yüklenemedi:", err);
      container.innerHTML =
        `<p class="meeting-empty">Talepler yüklenirken bir hata oluştu.</p>`;
    }
  );

  subscriptions.set(containerId, unsubscribe);
}

export async function talepYanitla(meetingId, karar) {
  if (!meetingId || !["kabul", "ret"].includes(karar)) return;

  try {
    await updateDoc(doc(db, "meetings", meetingId), { durum: karar });

    if (karar === "kabul") {
      showMessage("Buluşma onaylandı!", "success");
    } else {
      showMessage("Buluşma talebi reddedildi.", "info");
    }
  } catch (err) {
    console.error("Talep yanıtlanamadı:", err);
    showMessage("Yanıt gönderilirken bir hata oluştu.", "warning");
  }
}
