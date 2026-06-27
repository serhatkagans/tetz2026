let unsubscribeStudents = null;

/**
 * Tarihi düzgün bir formatta gösterir.
 */
function formatTarih(timestamp) {
  if (!timestamp) return 'Belirtilmemiş';
  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  try {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
  } catch (e) {}
  return String(timestamp);
}

/**
 * 1) Moderasyon modülünü başlatır ve Auth durumuna göre yönlendirir.
 * @param {string} containerId - Panel bileşeninin çizileceği HTML elementinin id'si
 */
export function renderModerasyon(containerId) {
  const { auth, authApi } = window.tetz;
  if (!auth || !authApi) {
    console.error("Firebase auth/authApi bulunamadı.");
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div style="color: var(--accent); padding: 20px;">Hata: Firebase başlatılamadı.</div>`;
    }
    return;
  }

  authApi.onAuthStateChanged(auth, (user) => {
    // Anonim kullanıcılar da yetkili sayılmaz, bu nedenle email/şifre ile giriş yapmış olmalıdır
    const isModerator = user && !user.isAnonymous;
    if (isModerator) {
      renderOnayPaneli(containerId);
    } else {
      if (typeof unsubscribeStudents === 'function') {
        unsubscribeStudents();
        unsubscribeStudents = null;
      }
      renderGirisFormu(containerId);
    }
  });
}

/**
 * 2) Yetkili giriş formunu render eder.
 * @param {string} containerId
 */
export async function renderGirisFormu(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="mod-login-card" style="max-width: 400px; margin: 40px auto; padding: 25px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <h3 style="margin-bottom: 20px; font-size: 20px; text-align: center; color: var(--text);">Yetkili Moderatör Girişi</h3>
      <form id="mod-login-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label for="mod-email" style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-muted);">E-posta</label>
          <input type="email" id="mod-email" placeholder="ornek@tetz2026.com" required style="width: 100%; box-sizing: border-box;" />
        </div>
        <div>
          <label for="mod-password" style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-muted);">Şifre</label>
          <input type="password" id="mod-password" placeholder="••••••••" required style="width: 100%; box-sizing: border-box;" />
        </div>
        <div id="mod-error-msg" style="color: var(--accent); font-size: 13px; display: none; margin-top: 4px;">Email veya şifre hatalı</div>
        <button type="submit" style="width: 100%; padding: 10px; font-weight: 600; margin-top: 8px;">Giriş Yap</button>
      </form>
    </div>
  `;

  const form = document.getElementById("mod-login-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("mod-email").value.trim();
      const password = document.getElementById("mod-password").value;
      const errorMsg = document.getElementById("mod-error-msg");

      errorMsg.style.display = "none";

      try {
        const { auth, authApi } = window.tetz;
        await authApi.signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        console.error("Giriş hatası:", error);
        errorMsg.style.display = "block";
        errorMsg.textContent = "Email veya şifre hatalı";
      }
    });
  }
}

/**
 * 3) Bekleyen onayları gösteren onay panelini render eder.
 * @param {string} containerId
 */
export async function renderOnayPaneli(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (typeof unsubscribeStudents === 'function') {
    unsubscribeStudents();
  }

  const { db, firestore, auth, authApi } = window.tetz;
  const { collection, onSnapshot, doc, updateDoc, deleteDoc } = firestore;

  container.innerHTML = `
    <div class="moderation-panel" style="display: flex; flex-direction: column; gap: var(--gap);">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
        <div>
          <h3 style="font-size: 20px; color: var(--text);">Onay Paneli</h3>
          <div id="stats-summary" style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">
            Bekleyen kayıtlar hesaplanıyor...
          </div>
        </div>
        <button id="btn-cikis" style="background: var(--surface-2); border: 1px solid var(--border); color: var(--text-muted);">Çıkış Yap</button>
      </div>
      <div id="pending-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
        <!-- Öğrenci kartları burada yüklenecektir -->
      </div>
    </div>
  `;

  const panelEl = container.querySelector('.moderation-panel');
  if (panelEl) {
    panelEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      // 4) Çıkış butonu işlemi
      if (btn.id === 'btn-cikis') {
        btn.disabled = true;
        btn.textContent = 'Çıkış yapılıyor...';
        try {
          if (typeof unsubscribeStudents === 'function') {
            unsubscribeStudents();
            unsubscribeStudents = null;
          }
          await authApi.signOut(auth);
        } catch (err) {
          console.error("Çıkış hatası:", err);
          btn.disabled = false;
          btn.textContent = 'Çıkış Yap';
        }
        return;
      }

      const studentId = btn.dataset.id;
      if (!studentId) return;

      if (btn.classList.contains('btn-onayla')) {
        btn.disabled = true;
        btn.textContent = 'Onaylanıyor...';
        try {
          const studentRef = doc(db, 'students', studentId);
          await updateDoc(studentRef, { onaylandi: true });
        } catch (err) {
          console.error("Onaylama hatası:", err);
          alert("Onaylama başarısız oldu: " + err.message);
          btn.disabled = false;
          btn.textContent = 'Onayla';
        }
      } else if (btn.classList.contains('btn-reddet')) {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
          btn.disabled = true;
          btn.textContent = 'Siliniyor...';
          try {
            const studentRef = doc(db, 'students', studentId);
            await deleteDoc(studentRef);
          } catch (err) {
            console.error("Silme hatası:", err);
            alert("Silme başarısız oldu: " + err.message);
            btn.disabled = false;
            btn.textContent = 'Reddet';
          }
        }
      }
    });
  }

  unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
    const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const pending = students.filter(s => s.onaylandi === false || s.onaylandi === undefined);
    const approvedCount = students.filter(s => s.onaylandi === true).length;

    // Üstte özet güncellemesi: 'X bekleyen, Y onaylanan'
    const statsSummary = document.getElementById('stats-summary');
    if (statsSummary) {
      statsSummary.innerHTML = `<strong>${pending.length}</strong> bekleyen, <strong>${approvedCount}</strong> onaylanan`;
    }

    const pendingList = document.getElementById('pending-list');
    if (!pendingList) return;

    if (pending.length === 0) {
      pendingList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--surface-2); border: 1px dashed var(--border); border-radius: var(--radius);">
          Onay bekleyen öğrenci bulunmamaktadır.
        </div>
      `;
      return;
    }

    pendingList.innerHTML = pending.map(student => {
      const interests = student.ilgiAlanlari || [];
      const interestsHtml = Array.isArray(interests)
        ? interests.map(i => `<span style="display: inline-block; background: var(--border); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; margin-bottom: 6px; color: var(--text);">${i}</span>`).join('')
        : `<span style="color: var(--text-muted);">${interests || '-'}</span>`;

      const dateStr = formatTarih(student.createdAt || student.tarih || student.kayitTarihi);

      return `
        <div class="student-card" style="padding: 16px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
            <div>
              <h4 style="font-size: 16px; color: var(--text); margin-bottom: 4px;">${student.ad || 'İsimsiz Öğrenci'}</h4>
              <p style="font-size: 13px; color: var(--text-muted);">${student.okul || 'Okul Belirtilmemiş'} • ${student.sinif || 'Sınıf Belirtilmemiş'}</p>
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">${dateStr}</span>
          </div>

          <div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">İlgi Alanları:</div>
            <div style="display: flex; flex-wrap: wrap;">
              ${interestsHtml}
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 4px; justify-content: flex-end;">
            <button class="btn-reddet" data-id="${student.id}" style="background: var(--accent); color: white; padding: 6px 12px; border-radius: 6px;">Reddet</button>
            <button class="btn-onayla" data-id="${student.id}" style="background: #22C55E; color: white; padding: 6px 12px; border-radius: 6px;">Onayla</button>
          </div>
        </div>
      `;
    }).join('');
  }, (error) => {
    console.error("Firestore veri yükleme hatası:", error);
    const pendingList = document.getElementById('pending-list');
    if (pendingList) {
      pendingList.innerHTML = `
        <div style="color: var(--accent); padding: 20px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px;">
          Veriler yüklenirken yetki hatası oluştu. Lütfen giriş yaptığınızdan emin olun.
        </div>
      `;
    }
  });
}
