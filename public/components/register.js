export async function renderRegisterForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Kategorileri yükle
  let categories = [];
  try {
    const res = await fetch("../data/categories.json");
    if (!res.ok) {
      const local = await fetch("data/categories.json").catch(() => null);
      if (local && local.ok) {
        categories = await local.json();
      }
    } else {
      categories = await res.json();
    }
  } catch (error) {
    console.error("Kategoriler yüklenirken hata oluştu:", error);
  }

  // Form HTML yapısı (Mobil uyumlu ve Türkçe)
  const formHtml = `
    <div class="register-form-container" style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); box-sizing: border-box;">
      <h2 style="text-align: center; margin-bottom: 20px; font-family: sans-serif; color: #333;">Öğrenci Kayıt Formu</h2>
      <form id="tetz-register-form" style="display: flex; flex-direction: column; gap: 15px; font-family: sans-serif;">
        
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label for="adSoyad" style="font-weight: bold; color: #555;">Ad Soyad</label>
          <input type="text" id="adSoyad" name="adSoyad" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px;">
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label for="okul" style="font-weight: bold; color: #555;">Okul</label>
          <input type="text" id="okul" name="okul" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px;">
          <label for="sinif" style="font-weight: bold; color: #555;">Sınıf</label>
          <select id="sinif" name="sinif" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; background: #fff;">
            <option value="" disabled selected>Sınıfınızı Seçiniz</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="font-weight: bold; color: #555;">İlgi Alanları (En az 1 seçim zorunludur)</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #eee; border-radius: 5px; background: #fafafa;">
            ${categories.map(cat => `
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                <input type="checkbox" name="ilgiAlanlari" value="${cat.id}">
                <span>${cat.icon}</span> <span>${cat.name}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold; color: #333;">
            <input type="checkbox" id="bulusmaKabul" name="bulusmaKabul" required style="width: 18px; height: 18px;">
            Beni eşleştir
          </label>
        </div>

        <div id="form-message" style="margin-top: 10px; font-weight: bold; text-align: center; display: none; padding: 10px; border-radius: 5px;"></div>

        <button type="submit" style="margin-top: 15px; padding: 12px; background: #4F8CFF; color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s;">
          Kaydol
        </button>
      </form>
    </div>
  `;

  container.innerHTML = formHtml;

  const form = document.getElementById('tetz-register-form');
  const messageEl = document.getElementById('form-message');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Submit eventi
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const adSoyad = document.getElementById('adSoyad').value.trim();
    const okul = document.getElementById('okul').value.trim();
    const sinif = document.getElementById('sinif').value;
    
    // Seçilen kategorileri al
    const ilgiAlanlariChecked = form.querySelectorAll('input[name="ilgiAlanlari"]:checked');
    const ilgiAlanlari = Array.from(ilgiAlanlariChecked).map(cb => cb.value);
    const bulusmaKabul = document.getElementById('bulusmaKabul').checked;

    if (ilgiAlanlari.length === 0) {
      alert("Lütfen en az 1 ilgi alanı seçiniz.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Kaydediliyor...";
      
      const { db, auth, firestore } = window.tetz;
      const { doc, setDoc, serverTimestamp } = firestore;

      const user = auth.currentUser;
      if (!user) {
        throw new Error("Oturum bulunamadı, lütfen sayfayı yenileyin.");
      }

      const studentData = {
        ad: adSoyad,
        okul: okul,
        sinif: sinif,
        ilgiAlanlari: ilgiAlanlari,
        bulusmaKabul: bulusmaKabul,
        onaylandi: false, // ÖNEMLİ: Her zaman false olacak
        uid: user.uid,
        kayitTarihi: serverTimestamp()
      };

      // Firestore 'students' koleksiyonuna kullanıcı kimliğiyle yaz.
      // Doküman ID = auth uid → eşleştirme bu kullanıcıyı tanıyabilsin.
      await setDoc(doc(db, 'students', user.uid), studentData);
      
      // Başarı mesajı
      messageEl.textContent = 'Kaydınız alındı';
      messageEl.style.backgroundColor = '#d4edda';
      messageEl.style.color = '#155724';
      messageEl.style.display = 'block';

      // Formu temizle
      form.reset();
      
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      messageEl.textContent = 'Kayıt sırasında bir hata oluştu.';
      messageEl.style.backgroundColor = '#f8d7da';
      messageEl.style.color = '#721c24';
      messageEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kaydol";
      
      // Mesajı bir süre sonra gizle
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  });
}
