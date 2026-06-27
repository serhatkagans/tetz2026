async function loadCategories() {
  const paths = ["../data/categories.json", "data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return res.json();
    } catch {
      /* try next path */
    }
  }
  return [];
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isToday(date) {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function findMostPopularInterest(students) {
  const counts = new Map();

  for (const student of students) {
    const interests = Array.isArray(student.ilgiAlanlari) ? student.ilgiAlanlari : [];
    for (const id of interests) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  let topId = null;
  let topCount = 0;

  for (const [id, count] of counts) {
    if (count > topCount) {
      topId = id;
      topCount = count;
    }
  }

  return topId;
}

function renderCards(container, { approvedCount, meetingsCount, popularName, todayCount }) {
  container.innerHTML = `
    <article class="stat-card">
      <span class="stat-icon" aria-hidden="true">👥</span>
      <div class="stat-body">
        <strong class="stat-value">${approvedCount}</strong>
        <span class="stat-label">Öğrenci</span>
      </div>
    </article>
    <article class="stat-card">
      <span class="stat-icon" aria-hidden="true">🤝</span>
      <div class="stat-body">
        <strong class="stat-value">${meetingsCount}</strong>
        <span class="stat-label">Buluşma</span>
      </div>
    </article>
    <article class="stat-card">
      <span class="stat-icon" aria-hidden="true">🏆</span>
      <div class="stat-body">
        <strong class="stat-value stat-value--text">${popularName}</strong>
        <span class="stat-label">En Popüler</span>
      </div>
    </article>
    <article class="stat-card">
      <span class="stat-icon" aria-hidden="true">📅</span>
      <div class="stat-body">
        <strong class="stat-value">${todayCount}</strong>
        <span class="stat-label">Bugün</span>
      </div>
    </article>
  `;
}

export async function renderStats(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { db, firestore } = window.tetz;
  const { collection, getDocs, query, where } = firestore;

  container.innerHTML = `<p class="stats-loading">İstatistikler yükleniyor…</p>`;

  try {
    const [approvedSnap, meetingsSnap, allStudentsSnap, categories] = await Promise.all([
      getDocs(query(collection(db, "students"), where("onaylandi", "==", true))),
      getDocs(query(collection(db, "meetings"), where("durum", "==", "kabul"))),
      getDocs(collection(db, "students")),
      loadCategories()
    ]);

    const students = allStudentsSnap.docs.map((docSnap) => docSnap.data());
    const approvedCount = approvedSnap.size;
    const meetingsCount = meetingsSnap.size;

    const topId = findMostPopularInterest(students);
    const popularName = topId
      ? categories.find((category) => category.id === topId)?.name || topId
      : "—";

    const todayCount = students.filter((student) => {
      const createdAt = toDate(
        student.olusturulmaTarihi || student.createdAt || student.tarih
      );
      return isToday(createdAt);
    }).length;

    renderCards(container, {
      approvedCount,
      meetingsCount,
      popularName,
      todayCount
    });
  } catch (error) {
    console.error("İstatistikler yüklenemedi:", error);
    container.innerHTML = `<p class="stats-error">İstatistikler şu an yüklenemedi.</p>`;
  }
}
