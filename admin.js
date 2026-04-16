const API = '';
let currentUser = null;
let allReservations = [];
let allGuests = [];
let currentFilter = 'all';
let sidebarCollapsed = false;

// ===== AUTH =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  btn.disabled = true; btn.textContent = 'Входим...'; err.style.display = 'none';

  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('username').value, password: document.getElementById('password').value })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'flex';
      document.getElementById('adminUsername').textContent = currentUser.username;
      init();
    } else { err.style.display = 'flex'; }
  } catch { err.style.display = 'flex'; }

  btn.disabled = false; btn.textContent = 'Войти';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('password').value = '';
});

// ===== INIT =====
function init() { loadStats(); loadReservations(); loadGuests(); }

// ===== SIDEBAR TOGGLE =====
const sidebar   = document.getElementById('sidebar');
const adminMain = document.getElementById('adminMain');

document.getElementById('burgerAdmin').addEventListener('click', () => {
  // Desktop: collapse/expand; Mobile: open drawer
  if (window.innerWidth > 768) {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    adminMain.classList.toggle('expanded', sidebarCollapsed);
  } else {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('visible');
  }
});

// Mobile overlay
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);
overlay.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('visible');
});

// ===== TABS =====
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    const titles = { reservations: 'Брони столов', guests: 'Гости' };
    document.getElementById('pageTitle').textContent = titles[tab] || tab;
    // Close mobile sidebar on nav click
    if (window.innerWidth <= 768) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('visible'); }
  });
});

// ===== REFRESH =====
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadStats(); loadReservations(); loadGuests();
  showToast('Данные обновлены');
});

// ===== STATS =====
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/stats`);
    const d = await res.json();
    document.getElementById('statTotal').textContent  = d.total_reservations;
    document.getElementById('statNew').textContent    = d.new_reservations;
    document.getElementById('statGuests').textContent = d.total_guests;
    document.getElementById('statToday').textContent  = d.today_reservations;
    const badge = document.getElementById('navBadge');
    if (d.new_reservations > 0) { badge.textContent = d.new_reservations; badge.style.display = 'inline'; }
    else badge.style.display = 'none';
  } catch(e) {}
}

// ===== RESERVATIONS =====
async function loadReservations() {
  try {
    const res = await fetch(`${API}/api/reservations`);
    allReservations = await res.json();
    renderReservations();
  } catch {
    document.getElementById('resCards').innerHTML = `<div class="cards-empty"><i class="fas fa-exclamation-circle"></i>Ошибка загрузки данных</div>`;
  }
}

function renderReservations() {
  const search = document.getElementById('searchRes').value.toLowerCase();
  const rows = allReservations.filter(r => {
    const matchStatus = currentFilter === 'all' || r.status === currentFilter;
    const matchSearch = !search ||
      r.guest_name.toLowerCase().includes(search) ||
      r.guest_phone.includes(search) ||
      r.guest_email.toLowerCase().includes(search) ||
      r.id.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  const container = document.getElementById('resCards');
  if (!rows.length) {
    container.innerHTML = `<div class="cards-empty"><i class="fas fa-calendar-times"></i>Нет записей по выбранным фильтрам</div>`;
    return;
  }

  container.innerHTML = rows.map(r => `
    <div class="res-card status-${r.status}">
      <div class="res-card-head">
        <div>
          <div class="res-card-id">${escHtml(r.id)}</div>
          <div class="res-card-name">${escHtml(r.guest_name)}</div>
          <div class="res-card-phone">${escHtml(r.guest_phone)}</div>
        </div>
        <div>${statusBadge(r.status)}</div>
      </div>
      <div class="res-card-meta">
        <div class="res-meta-chip"><i class="fas fa-calendar"></i> ${r.reservation_date}</div>
        <div class="res-meta-chip"><i class="fas fa-clock"></i> ${r.reservation_time}</div>
        <div class="res-meta-chip"><i class="fas fa-users"></i> ${r.guests_count} чел.</div>
        ${r.comment ? `<div class="res-meta-chip"><i class="fas fa-comment"></i> ${escHtml(r.comment.slice(0,30))}${r.comment.length > 30 ? '…' : ''}</div>` : ''}
      </div>
      <div class="res-card-footer">
        <div class="res-card-actions">
          <button class="card-action view" onclick="showResModal('${r.id}')"><i class="fas fa-eye"></i> Детали</button>
          ${r.status === 'new' ? `<button class="card-action confirm" onclick="updateStatus('${r.id}','confirmed')"><i class="fas fa-check"></i> Подтвердить</button>` : ''}
          ${r.status === 'confirmed' ? `<button class="card-action complete" onclick="updateStatus('${r.id}','completed')"><i class="fas fa-flag-checkered"></i> Завершить</button>` : ''}
          ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button class="card-action cancel" onclick="updateStatus('${r.id}','cancelled')"><i class="fas fa-times"></i> Отмена</button>` : ''}
        </div>
        <span style="font-size:.72rem;color:var(--text-dim)">${timeAgo(r.created_at)}</span>
      </div>
    </div>
  `).join('');
}

// Filters
document.querySelectorAll('.chip[data-status]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-status]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.status;
    renderReservations();
  });
});
document.getElementById('searchRes').addEventListener('input', renderReservations);

// Update status
async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API}/api/reservations/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const d = await res.json();
    if (d.success) {
      await loadReservations(); await loadStats();
      closeResModal();
      const labels = { confirmed: '✅ Подтверждено', completed: '🏁 Завершено', cancelled: '❌ Отменено' };
      showToast(labels[status] || 'Статус обновлён');
    }
  } catch { showToast('Ошибка обновления'); }
}

// Modal
function showResModal(id) {
  const r = allReservations.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modalResTitle').textContent = `Бронь ${r.id}`;
  document.getElementById('resModalBody').innerHTML = `
    <div class="modal-row"><span class="modal-label">Гость</span><span class="modal-val">${escHtml(r.guest_name)}</span></div>
    <div class="modal-row"><span class="modal-label">Телефон</span><span class="modal-val">${escHtml(r.guest_phone)}</span></div>
    <div class="modal-row"><span class="modal-label">Email</span><span class="modal-val">${escHtml(r.guest_email)}</span></div>
    <hr class="modal-divider">
    <div class="modal-row"><span class="modal-label">Дата</span><span class="modal-val">${r.reservation_date}</span></div>
    <div class="modal-row"><span class="modal-label">Время</span><span class="modal-val">${r.reservation_time}</span></div>
    <div class="modal-row"><span class="modal-label">Гостей</span><span class="modal-val">${r.guests_count} чел.</span></div>
    ${r.comment ? `<div class="modal-row"><span class="modal-label">Пожелания</span><span class="modal-val">${escHtml(r.comment)}</span></div>` : ''}
    <hr class="modal-divider">
    <div class="modal-row"><span class="modal-label">Статус</span><span class="modal-val">${statusBadge(r.status)}</span></div>
    <div class="modal-row"><span class="modal-label">Создано</span><span class="modal-val">${new Date(r.created_at).toLocaleString('ru')}</span></div>
    <div class="modal-actions">
      ${r.status === 'new'       ? `<button class="modal-btn modal-btn-confirm"  onclick="updateStatus('${r.id}','confirmed')">Подтвердить</button>` : ''}
      ${r.status === 'confirmed' ? `<button class="modal-btn modal-btn-complete" onclick="updateStatus('${r.id}','completed')">Завершить</button>` : ''}
      ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button class="modal-btn modal-btn-cancel" onclick="updateStatus('${r.id}','cancelled')">Отменить</button>` : ''}
    </div>
  `;
  document.getElementById('resModal').style.display = 'flex';
}
function closeResModal() { document.getElementById('resModal').style.display = 'none'; }
document.getElementById('closeResModal').addEventListener('click', closeResModal);
document.getElementById('resModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeResModal(); });

// Export
document.getElementById('exportBtn').addEventListener('click', () => {
  window.location.href = `${API}/api/export/reservations`;
});

// ===== GUESTS =====
async function loadGuests() {
  try {
    const res = await fetch(`${API}/api/guests`);
    allGuests = await res.json();
    renderGuests();
  } catch { document.getElementById('guestsBody').innerHTML = `<tr><td colspan="6" class="table-empty">Ошибка загрузки</td></tr>`; }
}

function renderGuests() {
  const search = document.getElementById('searchGuests').value.toLowerCase();
  const rows = allGuests.filter(g => !search || g.name.toLowerCase().includes(search) || g.phone.includes(search) || g.email.toLowerCase().includes(search));
  if (!rows.length) { document.getElementById('guestsBody').innerHTML = `<tr><td colspan="6" class="table-empty">Нет гостей</td></tr>`; return; }
  document.getElementById('guestsBody').innerHTML = rows.map(g => `
    <tr>
      <td style="color:var(--text-dim);font-family:monospace">${g.id}</td>
      <td><strong>${escHtml(g.name)}</strong></td>
      <td>${escHtml(g.phone)}</td>
      <td style="color:var(--text-mid)">${escHtml(g.email)}</td>
      <td><span style="background:var(--blue-glow);color:var(--blue-pale);padding:3px 10px;border-radius:12px;font-size:.75rem">${g.visits_count}</span></td>
      <td style="color:var(--text-mid)">${g.last_visit ? new Date(g.last_visit).toLocaleDateString('ru') : '—'}</td>
    </tr>
  `).join('');
}
document.getElementById('searchGuests').addEventListener('input', renderGuests);

// ===== HELPERS =====
function statusBadge(s) {
  const map = { new: ['badge-new','Новая'], confirmed: ['badge-confirmed','Подтверждена'], completed: ['badge-completed','Завершена'], cancelled: ['badge-cancelled','Отменена'] };
  const [cls, label] = map[s] || ['badge-new', s];
  return `<span class="badge ${cls}">${label}</span>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'только что';
  if (mins < 60)  return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн. назад`;
}

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
