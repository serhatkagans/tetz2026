/**
 * TETZ2026 - Bildirim ve Mesajlaşma Bileşeni (Ekip 7)
 * 
 * Lüks ve premium renk paleti (Derin Obsidyen, Velvet Mor ve Şampanya Altını) ile tasarlanmıştır.
 * Firestore çevrimdışı olduğunda otomatik LocalStorage simülasyonuna geçiş yapar.
 */

// Yerel Simülasyon Veritabanı
const mockDb = {
  getMeetings() {
    try {
      const data = localStorage.getItem("tetz_meetings");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveMeetings(meetings) {
    localStorage.setItem("tetz_meetings", JSON.stringify(meetings));
    window.dispatchEvent(new CustomEvent("tetz-db-update-meetings"));
  },
  getMessages(meetingId) {
    try {
      const data = localStorage.getItem(`tetz_messages_${meetingId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveMessages(meetingId, messages) {
    localStorage.setItem(`tetz_messages_${meetingId}`, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(`tetz-db-update-messages-${meetingId}`));
  }
};

// Başlangıç simüle verileri (Türkçe Kurumsal)
function seedMockData() {
  if (!localStorage.getItem("tetz_meetings")) {
    localStorage.setItem("tetz_meetings", JSON.stringify([
      {
        id: "meeting_test_1",
        alici: "ogrenci_123",
        gonderen: "ahmet_yazilimci",
        durum: "bekliyor",
        olusturmaTarihi: new Date().toISOString()
      },
      {
        id: "meeting_test_2",
        alici: "ogrenci_123",
        gonderen: "ekip_7_mentor",
        durum: "kabul",
        olusturmaTarihi: new Date().toISOString()
      }
    ]));
  }

  if (!localStorage.getItem("tetz_messages_meeting_test_2")) {
    localStorage.setItem("tetz_messages_meeting_test_2", JSON.stringify([
      {
        id: "m1",
        gonderen: "ekip_7_mentor",
        metin: "Merhaba, eşleşme talebiniz onaylandı. Görüşmeye başlayabilirsiniz.",
        tarih: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: "m2",
        gonderen: "ogrenci_123",
        metin: "Teşekkürler. Arayüz renkleri ve geçişleri mükemmel görünüyor.",
        tarih: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: "m3",
        gonderen: "ekip_7_mentor",
        metin: "Rica ederim. İyi çalışmalar dilerim.",
        tarih: new Date(Date.now() - 60000).toISOString()
      }
    ]));
  }
}

seedMockData();

// CSS stillerini lüks tasarımla dinamik olarak head'e ekleyen fonksiyon
function injectStyles() {
  if (document.getElementById("tetz-notification-styles")) return;
  const style = document.createElement("style");
  style.id = "tetz-notification-styles";
  style.textContent = `
    /* Lüks Bildirim Rozeti */
    .tetz-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--accent, #be123c);
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      border-radius: 50%;
      min-width: 19px;
      height: 19px;
      padding: 0 4px;
      margin-left: 8px;
      vertical-align: middle;
      box-shadow: 0 2px 8px rgba(190, 18, 60, 0.4);
      transition: all 0.2s ease;
      font-feature-settings: "tnum";
    }

    /* Lüks Mesajlaşma Konteyneri */
    .tetz-chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 400px;
      background: var(--surface, #0e1014);
      border: 1px solid var(--border, #2a2b36);
      border-radius: var(--radius, 12px);
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }

    .tetz-chat-header {
      padding: 18px 24px;
      background: var(--surface-2, #14171d);
      border-bottom: 1px solid var(--border, #2a2b36);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tetz-chat-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text, #f5f5f7);
      margin: 0;
      letter-spacing: -0.1px;
    }

    .tetz-chat-messages {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--surface, #0e1014);
    }

    /* Minimalist Lüks Scrollbar */
    .tetz-chat-messages::-webkit-scrollbar {
      width: 4px;
    }
    .tetz-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .tetz-chat-messages::-webkit-scrollbar-thumb {
      background: var(--border, #2a2b36);
      border-radius: 4px;
    }
    .tetz-chat-messages::-webkit-scrollbar-thumb:hover {
      background: var(--luxury-gold, #c5a880);
    }

    .tetz-chat-bubble-wrapper {
      display: flex;
      width: 100%;
    }

    .tetz-chat-bubble-wrapper.self {
      justify-content: flex-end;
    }

    .tetz-chat-bubble-wrapper.other {
      justify-content: flex-start;
    }

    /* Lüks Yuvarlatılmış Mesaj Balonları */
    .tetz-chat-bubble {
      max-width: 70%;
      padding: 10px 16px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 4px;
      word-break: break-word;
    }

    /* Velvet Moru & Gradyan */
    .tetz-chat-bubble-wrapper.self .tetz-chat-bubble {
      background: linear-gradient(135deg, var(--primary, #5b21b6), #4c1d95);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 12px rgba(76, 29, 149, 0.2);
    }

    /* Karbon Koyu Arka Plan & Lüks İnce Sınır Hattı */
    .tetz-chat-bubble-wrapper.other .tetz-chat-bubble {
      background: var(--surface-2, #14171d);
      color: var(--text, #f5f5f7);
      border: 1px solid var(--border, #2a2b36);
      border-bottom-left-radius: 4px;
    }

    .tetz-chat-time {
      font-size: 9px;
      align-self: flex-end;
      font-weight: 500;
    }

    .tetz-chat-bubble-wrapper.self .tetz-chat-time {
      color: rgba(255, 255, 255, 0.6);
    }

    .tetz-chat-bubble-wrapper.other .tetz-chat-time {
      color: var(--text-muted, #7c7c82);
    }

    /* İletişim Formu */
    .tetz-chat-input-area {
      display: flex;
      gap: 12px;
      padding: 18px 24px;
      background: var(--surface-2, #14171d);
      border-top: 1px solid var(--border, #2a2b36);
    }

    .tetz-chat-input-area input {
      flex: 1;
      background: var(--surface, #0e1014);
      border: 1px solid var(--border, #2a2b36);
      color: var(--text, #f5f5f7);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s ease;
    }

    .tetz-chat-input-area input:focus {
      border-color: var(--luxury-gold, #c5a880);
      box-shadow: 0 0 0 1px var(--luxury-gold, #c5a880);
    }

    .tetz-chat-btn {
      background: var(--luxury-gold, #c5a880);
      color: #0e1014;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tetz-chat-btn:hover {
      background: #dfc59e;
      transform: translateY(-1px);
    }

    .tetz-chat-empty, .tetz-chat-loading, .tetz-chat-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: var(--text-muted, #7c7c82);
      font-size: 13px;
      text-align: center;
      padding: 20px;
    }

    .tetz-chat-error {
      color: var(--accent, #be123c);
      background: rgba(190, 18, 60, 0.05);
      border: 1px dashed rgba(190, 18, 60, 0.2);
      border-radius: 8px;
      margin: 16px;
      height: auto;
      min-height: auto;
    }
  `;
  document.head.appendChild(style);
}

// Bağımlılıkları dinamik çeken yardımcı fonksiyon
function getDeps() {
  if (!window.tetz || !window.tetz.db || !window.tetz.firestore) {
    throw new Error("window.tetz nesnesi veya Firestore API'si hazır değil.");
  }
  return {
    db: window.tetz.db,
    ...window.tetz.firestore
  };
}

/**
 * 1) initNotifications(containerId, ogrenciid)
 * Gelen bekleyen isteklerin sayısını kırmızı daire içinde rozet olarak gösterir.
 */
export function initNotifications(containerId, ogrenciid) {
  injectStyles();
  const container = document.getElementById(containerId);
  if (!container) return () => {};

  let badge = container.querySelector(".tetz-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tetz-badge";
    badge.style.display = "none";
    container.appendChild(badge);
  }

  const updateBadge = (count) => {
    // Orijinal kural: "Rozet: kırmızı daire içinde sayı, 8 ise gizle."
    if (count === 8) {
      badge.style.display = "none";
    } else if (count > 0) {
      badge.style.display = "inline-flex";
      badge.textContent = count;
    }
    // count === 0 ise rozet başlangıç durumunda zaten gizli kalır
  };

  let useMock = false;
  let unsubscribeReal = null;

  const startMockListener = () => {
    const checkMockData = () => {
      const meetings = mockDb.getMeetings();
      const count = meetings.filter(m => m.alici === ogrenciid && m.durum === "bekliyor").length;
      updateBadge(count);
    };

    checkMockData();
    window.addEventListener("tetz-db-update-meetings", checkMockData);
    return () => {
      window.removeEventListener("tetz-db-update-meetings", checkMockData);
    };
  };

  try {
    const { db, collection, query, where, onSnapshot } = getDeps();
    const q = query(
      collection(db, "meetings"),
      where("alici", "==", ogrenciid),
      where("durum", "==", "bekliyor")
    );

    unsubscribeReal = onSnapshot(q, (snap) => {
      updateBadge(snap.size);
    }, (err) => {
      console.warn("[TETZ] Firestore Bildirim Hatası. Yerel simülasyona geçiliyor:", err);
      if (!useMock) {
        useMock = true;
        unsubscribeReal = startMockListener();
      }
    });

    return () => {
      if (unsubscribeReal) unsubscribeReal();
    };
  } catch (err) {
    console.warn("[TETZ] Firebase hazır değil. Yerel simülasyon başlatılıyor.");
    return startMockListener();
  }
}

/**
 * 2) async renderMesajlasma(containerId, meetingId, ogrenciid)
 * Lüks tasarımlı mesajlaşma panelini yükler.
 */
export async function renderMesajlasma(containerId, meetingId, ogrenciid) {
  injectStyles();
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<div class="tetz-chat-loading">Görüşme durumu sorgulanıyor...</div>`;

  let useMock = false;
  let meetingData = null;

  try {
    const { db, doc, getDoc } = getDeps();
    const meetingRef = doc(db, "meetings", meetingId);
    const meetingSnap = await getDoc(meetingRef);

    if (meetingSnap.exists()) {
      meetingData = meetingSnap.data();
    }
  } catch (err) {
    console.warn("[TETZ] Firestore erişim hatası, yerel simülasyona geçiliyor:", err.message);
    useMock = true;
  }

  if (useMock || !meetingData) {
    const mockMeetings = mockDb.getMeetings();
    meetingData = mockMeetings.find(m => m.id === meetingId);
    useMock = true;
  }

  // Otomatik görüşme oluştur (test kolaylığı için)
  if (!meetingData) {
    meetingData = {
      id: meetingId,
      alici: ogrenciid,
      gonderen: "ekip_7_mentor",
      durum: "kabul",
      olusturmaTarihi: new Date().toISOString()
    };
    const currentMeetings = mockDb.getMeetings();
    currentMeetings.push(meetingData);
    mockDb.saveMeetings(currentMeetings);
    useMock = true;
  }

  if (meetingData.durum !== "kabul") {
    container.innerHTML = `
      <div class="tetz-chat-error">
        <p>Mesajlaşma başlatılamadı. Bu görüşme onaylanmamış.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="tetz-chat-container">
      <div class="tetz-chat-header">
        <h3>Eşleşme Sohbeti: ${meetingId} ${useMock ? "(Simüle)" : ""}</h3>
      </div>
      <div id="tetz-messages-list-${meetingId}" class="tetz-chat-messages">
        <div class="tetz-chat-loading">Mesajlar yükleniyor...</div>
      </div>
      <form id="tetz-chat-form-${meetingId}" class="tetz-chat-input-area">
        <input 
          type="text" 
          id="tetz-chat-input-${meetingId}" 
          placeholder="Mesajınızı yazın..." 
          autocomplete="off" 
          required 
        />
        <button type="submit" class="tetz-chat-btn">Gönder</button>
      </form>
    </div>
  `;

  const messagesListId = `tetz-messages-list-${meetingId}`;
  renderMesajlar(messagesListId, meetingId, ogrenciid);

  const form = document.getElementById(`tetz-chat-form-${meetingId}`);
  const input = document.getElementById(`tetz-chat-input-${meetingId}`);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const metin = input.value.trim();
    if (!metin) return;

    input.value = "";
    input.focus();

    if (useMock) {
      const currentMessages = mockDb.getMessages(meetingId);
      currentMessages.push({
        id: "msg_" + Date.now(),
        gonderen: ogrenciid,
        metin: metin,
        tarih: new Date().toISOString()
      });
      mockDb.saveMessages(meetingId, currentMessages);
    } else {
      try {
        const { db, collection, addDoc, serverTimestamp } = getDeps();
        const messagesRef = collection(db, "messages", meetingId, "mesajlar");
        await addDoc(messagesRef, {
          gonderen: ogrenciid,
          metin: metin,
          tarih: serverTimestamp()
        });
      } catch (err) {
        console.warn("[TETZ] Yazma hatası, simülasyon moduna yazılıyor:", err);
        useMock = true;
        const currentMessages = mockDb.getMessages(meetingId);
        currentMessages.push({
          id: "msg_" + Date.now(),
          gonderen: ogrenciid,
          metin: metin,
          tarih: new Date().toISOString()
        });
        mockDb.saveMessages(meetingId, currentMessages);
      }
    }
  });
}

/**
 * 3) renderMesajlar(containerId, meetingId, ogrenciid)
 * Mesajları sağ/sol hizalı olarak lüks kartlar halinde çizer.
 */
export function renderMesajlar(containerId, meetingId, ogrenciid = null) {
  injectStyles();
  const container = document.getElementById(containerId);
  if (!container) return () => {};

  const myId = ogrenciid || window.tetz.auth?.currentUser?.uid || "";
  let unsubscribeReal = null;
  let useMock = false;

  const renderHTML = (messages) => {
    messages.sort((a, b) => {
      const getMs = (t) => {
        if (!t) return Date.now();
        if (t.seconds) return t.seconds * 1000 + (t.nanoseconds || 0) / 1000000;
        if (t.toDate) return t.toDate().getTime();
        return new Date(t).getTime();
      };
      return getMs(a.tarih) - getMs(b.tarih);
    });

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="tetz-chat-empty">
          <p>Henüz mesaj bulunmuyor.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isSelf = msg.gonderen === myId;
      const bubbleClass = isSelf ? "self" : "other";

      let timeStr = "";
      if (msg.tarih) {
        let date;
        if (msg.tarih.toDate) {
          date = msg.tarih.toDate();
        } else if (msg.tarih.seconds) {
          date = new Date(msg.tarih.seconds * 1000);
        } else {
          date = new Date(msg.tarih);
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        timeStr = `${hours}:${minutes}`;
      } else {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeStr = `${hours}:${minutes}`;
      }

      const escapedText = msg.metin
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      return `
        <div class="tetz-chat-bubble-wrapper ${bubbleClass}">
          <div class="tetz-chat-bubble">
            <div class="tetz-chat-bubble-text">${escapedText}</div>
            <div class="tetz-chat-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join("");

    container.scrollTop = container.scrollHeight;
  };

  const startMockListener = () => {
    const checkMockData = () => {
      const messages = mockDb.getMessages(meetingId);
      renderHTML(messages);
    };

    checkMockData();
    window.addEventListener(`tetz-db-update-messages-${meetingId}`, checkMockData);
    return () => {
      window.removeEventListener(`tetz-db-update-messages-${meetingId}`, checkMockData);
    };
  };

  try {
    const { db, collection, onSnapshot } = getDeps();
    const messagesRef = collection(db, "messages", meetingId, "mesajlar");

    unsubscribeReal = onSnapshot(messagesRef, (snap) => {
      if (!document.getElementById(containerId)) {
        unsubscribeReal();
        return;
      }
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderHTML(messages);
    }, (err) => {
      console.warn("[TETZ] Firestore Mesaj Hatası. Simülasyon devrede:", err);
      if (!useMock) {
        useMock = true;
        unsubscribeReal = startMockListener();
      }
    });

    return () => {
      if (unsubscribeReal) unsubscribeReal();
    };
  } catch (err) {
    return startMockListener();
  }
}
