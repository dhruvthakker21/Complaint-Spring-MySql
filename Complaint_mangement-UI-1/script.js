/* ===========================
   ComplaintOS — script.js v3
   =========================== */

const BASE = 'http://localhost:8080';

// ─── State ────────────────────────────────────────────────────────────────────
let allComplaints  = [];
let allUsers       = [];
let deleteCallback = null;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const sidebar         = document.getElementById('sidebar');
const menuToggle      = document.getElementById('menuToggle');
const topbarTitle     = document.getElementById('topbarTitle');
const refreshBtn      = document.getElementById('refreshBtn');
const themeToggle     = document.getElementById('themeToggle');
const themeIcon       = document.getElementById('themeIcon');
const toast           = document.getElementById('toast');
const updateModal     = document.getElementById('updateModal');
const updateUserModal = document.getElementById('updateUserModal');
const confirmModal    = document.getElementById('confirmModal');
const viewModal       = document.getElementById('viewModal');

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
const html = document.documentElement;

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('clos-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('clos-theme', next);
  updateThemeIcon(next);
  showToast(`Switched to ${next} mode`, 'info');
});

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    themeIcon.className = 'fa-solid fa-moon';
    themeToggle.title   = 'Switch to Light Mode';
  } else {
    themeIcon.className = 'fa-solid fa-sun';
    themeToggle.title   = 'Switch to Dark Mode';
  }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>'
  };
  toast.className    = `toast show ${type}`;
  toast.innerHTML    = `${icons[type] || ''}<span>${msg}</span>`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3800);
}

// ─── FETCH WRAPPER ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const sectionTitles = {
  dashboard:         'Dashboard',
  users:             'User Management',
  complaints:        'Complaints',
  'create-complaint':'Create Complaint',
  lookup:            'Lookup',
  'delete-status':   'Delete By Status'
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s  => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n  => n.classList.remove('active'));
  document.getElementById(`section-${id}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-section="${id}"]`)?.classList.add('active');
  topbarTitle.textContent = sectionTitles[id] || id;
  sidebar.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('show');

  if (id === 'dashboard')        loadDashboard();
  if (id === 'users')            loadUsers();
  if (id === 'complaints')       loadComplaints();
  if (id === 'create-complaint') populateUserDropdown();
  if (id === 'delete-status')    updateStatusPreview();
}

document.querySelectorAll('.nav-item').forEach(item =>
  item.addEventListener('click', e => { e.preventDefault(); showSection(item.dataset.section); })
);
document.querySelectorAll('.link-btn').forEach(btn =>
  btn.addEventListener('click', () => showSection(btn.dataset.section))
);

// Mobile sidebar
const backdrop = document.createElement('div');
backdrop.id = 'sidebarBackdrop'; backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);
menuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); backdrop.classList.toggle('show'); });
backdrop.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); });

// Global refresh
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('spinning');
  const active = document.querySelector('.section.active')?.id?.replace('section-', '');
  if (active === 'dashboard')  loadDashboard();
  if (active === 'users')      loadUsers();
  if (active === 'complaints') loadComplaints();
  setTimeout(() => refreshBtn.classList.remove('spinning'), 800);
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [complaints, users] = await Promise.all([
      api('GET', '/compl/all'),
      api('GET', '/user/all')
    ]);

    const totalC = complaints?.length ?? 0;
    const openC  = complaints?.filter(c => c.status === 'OPEN').length ?? 0;
    const resolC = complaints?.filter(c => c.status === 'RESOLVED').length ?? 0;
    const totalU = users?.length ?? 0;

    animateCount('val-total-complaints', totalC);
    animateCount('val-open', openC);
    animateCount('val-resolved', resolC);
    animateCount('val-users', totalU);

    // Stat bottom bars
    setTimeout(() => {
      const max = Math.max(totalC, 1);
      setBarWidth('bar-total',    100);
      setBarWidth('bar-open',     Math.round((openC  / max) * 100));
      setBarWidth('bar-resolved', Math.round((resolC / max) * 100));
      setBarWidth('bar-users',    Math.min(totalU * 10, 100));
    }, 200);

    // Resolution rate
    const pct = totalC > 0 ? Math.round((resolC / totalC) * 100) : 0;
    document.getElementById('res-pct').textContent = pct + '%';
    setTimeout(() => { document.getElementById('progress-bar').style.width = pct + '%'; }, 200);

    // Recent complaints
    const rcBody = document.getElementById('recent-complaints-body');
    const recent = [...(complaints || [])].reverse().slice(0, 5);
    rcBody.innerHTML = recent.length
      ? recent.map(c => `<tr>
          <td><span class="id-chip">#${c.id}</span></td>
          <td>${escHtml(c.title)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${c.user?.name ? escHtml(c.user.name) : (c.user?.id ?? '—')}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">No complaints yet</td></tr>';

    // Recent users
    const ruBody = document.getElementById('recent-users-body');
    const recentU = [...(users || [])].reverse().slice(0, 5);
    ruBody.innerHTML = recentU.length
      ? recentU.map(u => `<tr>
          <td><span class="id-chip">#${u.id}</span></td>
          <td>${escHtml(u.name)}</td>
          <td>${escHtml(u.email)}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty-row">No users yet</td></tr>';

  } catch (err) {
    showToast('Cannot connect to Spring Boot on port 8080', 'error');
    console.error(err);
  }
}

function setBarWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = 0;
  const step  = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    val = Math.min(val + step, target);
    el.textContent = val;
    if (val >= target) clearInterval(timer);
  }, 22);
}

// ─── USERS ────────────────────────────────────────────────────────────────────
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="loading-row"><span class="spinner"></span> Loading users...</td></tr>';
  try {
    allUsers = await api('GET', '/user/all') || [];
    renderUsersTable(allUsers);
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Failed to load users</td></tr>';
    showToast('Could not fetch users', 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No users found</td></tr>'; return; }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><span class="id-chip">#${u.id}</span></td>
      <td style="font-weight:500;color:var(--text)">${escHtml(u.name)}</td>
      <td style="font-size:12.5px">${escHtml(u.email)}</td>
      <td>
        <div class="action-group">
          <button class="btn btn-icon btn-icon-edit" title="Edit"
            onclick="openUpdateUserModal(${u.id},'${escAttr(u.name)}','${escAttr(u.email)}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-icon btn-icon-delete" title="Delete"
            onclick="confirmDeleteUser(${u.id},'${escAttr(u.name)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

// Register
document.getElementById('registerUserForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  try {
    await api('POST', '/user/register', { name, email, password });
    showToast(`User "${name}" registered!`, 'success');
    e.target.reset(); loadUsers();
  } catch (err) { showToast('Register failed: ' + err.message, 'error'); }
});

document.getElementById('refreshUsers').addEventListener('click', loadUsers);

// Search by email
document.getElementById('searchEmailBtn').addEventListener('click', async () => {
  const email   = document.getElementById('search-email').value.trim();
  if (!email)   { showToast('Enter an email', 'info'); return; }
  const el      = document.getElementById('email-search-result');
  el.className  = 'lookup-result';
  el.innerHTML  = '<span class="spinner"></span> Searching…';
  try {
    const u = await api('GET', `/user/search?email=${encodeURIComponent(email)}`);
    if (!u?.id) throw new Error();
    el.innerHTML = `
      <div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#${u.id}</span></span></div>
      <div class="lr-row"><span class="lr-label">Name</span><span class="lr-value">${escHtml(u.name)}</span></div>
      <div class="lr-row"><span class="lr-label">Email</span><span class="lr-value">${escHtml(u.email)}</span></div>
      <div class="lr-actions">
        <button class="btn btn-sm btn-accent" onclick="openUpdateUserModal(${u.id},'${escAttr(u.name)}','${escAttr(u.email)}')">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
      </div>`;
    showToast(`Found: ${u.name}`, 'success');
  } catch {
    el.className = 'lookup-result error';
    el.innerHTML = '<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No user found with that email</span></div>';
  }
});
document.getElementById('search-email').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('searchEmailBtn').click(); });

// Update User Modal
function openUpdateUserModal(id, name, email) {
  document.getElementById('upd-user-id').value    = id;
  document.getElementById('upd-user-name').value  = name;
  document.getElementById('upd-user-email').value = email;
  document.getElementById('upd-user-pass').value  = '';
  updateUserModal.classList.add('open');
}
document.getElementById('closeUpdateUserModal').addEventListener('click', () => updateUserModal.classList.remove('open'));
updateUserModal.addEventListener('click', e => { if (e.target === updateUserModal) updateUserModal.classList.remove('open'); });

document.getElementById('updateUserForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = parseInt(document.getElementById('upd-user-id').value);
  const name  = document.getElementById('upd-user-name').value.trim();
  const email = document.getElementById('upd-user-email').value.trim();
  const pass  = document.getElementById('upd-user-pass').value.trim();
  if (!pass) { showToast('Password is required', 'error'); return; }
  try {
    await api('PUT', '/user/update', { id, name, email, password: pass });
    showToast(`User #${id} updated!`, 'success');
    updateUserModal.classList.remove('open');
    loadUsers(); loadDashboard();
  } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
});

// Delete User
function confirmDeleteUser(id, name) {
  document.getElementById('confirmText').textContent = `Delete user "${name}" (ID #${id})? This cannot be undone.`;
  deleteCallback = async () => {
    try {
      await api('DELETE', `/user/del/${id}`);
      showToast(`User #${id} deleted`, 'success');
      loadUsers(); loadDashboard();
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
}

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────
async function loadComplaints() {
  const tbody = document.getElementById('complaints-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-row"><span class="spinner"></span> Loading…</td></tr>';
  try {
    allComplaints = await api('GET', '/compl/all') || [];
    renderComplaintsTable(allComplaints);
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Failed to load complaints</td></tr>';
    showToast('Could not fetch complaints', 'error');
  }
}

function renderComplaintsTable(list) {
  const tbody = document.getElementById('complaints-tbody');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No complaints found</td></tr>'; return; }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><span class="id-chip">#${c.id}</span></td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:var(--text)">${escHtml(c.title)}</td>
      <td class="desc-cell" title="${escHtml(c.description)}">${escHtml(c.description)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.user?.name ? escHtml(c.user.name) : (c.user?.id ?? '—')}</td>
      <td class="date-cell">${formatDate(c.createdAt)}</td>
      <td>
        <div class="action-group">
          <button class="btn btn-icon btn-icon-view" title="View" onclick="openViewModal(${c.id})"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-icon btn-icon-edit" title="Edit" onclick="openUpdateModal(${c.id},'${escAttr(c.description)}','${c.status}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-icon btn-icon-delete" title="Delete" onclick="confirmDeleteComplaint(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function applyComplaintFilters() {
  const s = document.getElementById('complaintSearch').value.toLowerCase();
  const t = document.getElementById('statusFilter').value;
  renderComplaintsTable(allComplaints.filter(c =>
    (!s || c.title?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s)) &&
    (!t || c.status === t)
  ));
}
document.getElementById('complaintSearch').addEventListener('input', applyComplaintFilters);
document.getElementById('statusFilter').addEventListener('change', applyComplaintFilters);
document.getElementById('refreshComplaints').addEventListener('click', loadComplaints);

// View Complaint Modal
async function openViewModal(id) {
  const body = document.getElementById('complaint-detail-body');
  body.innerHTML = '<div style="padding:24px;text-align:center"><span class="spinner"></span></div>';
  viewModal.classList.add('open');
  try {
    const c = await api('GET', `/compl/${id}`);
    body.innerHTML = `
      <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value"><span class="id-chip">#${c.id}</span></span></div>
      <div class="detail-divider"></div>
      <div class="detail-row"><span class="detail-label">Title</span><span class="detail-value" style="font-weight:700;font-size:16px">${escHtml(c.title)}</span></div>
      <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value desc">${escHtml(c.description)}</span></div>
      <div class="detail-divider"></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(c.status)}</span></div>
      <div class="detail-row"><span class="detail-label">User</span><span class="detail-value">${c.user?.name ? escHtml(c.user.name) + ` <span style="color:var(--text-dim)">(#${c.user.id})</span>` : (c.user?.id ?? '—')}</span></div>
      <div class="detail-row"><span class="detail-label">Created</span><span class="detail-value date-cell">${formatDate(c.createdAt)}</span></div>
      <div class="detail-divider"></div>
      <div style="display:flex;gap:8px;padding-bottom:2px">
        <button class="btn btn-accent btn-sm" onclick="closeViewAndEdit(${c.id},'${escAttr(c.description)}','${c.status}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="viewModal.classList.remove('open')"><i class="fa-solid fa-xmark"></i> Close</button>
      </div>`;
  } catch {
    body.innerHTML = `<div style="padding:24px;color:var(--red)">Failed to load complaint #${id}</div>`;
  }
}
function closeViewAndEdit(id, desc, status) { viewModal.classList.remove('open'); openUpdateModal(id, desc, status); }
document.getElementById('closeViewModal').addEventListener('click', () => viewModal.classList.remove('open'));
viewModal.addEventListener('click', e => { if (e.target === viewModal) viewModal.classList.remove('open'); });

// Update Complaint Modal
function openUpdateModal(id, desc, status) {
  document.getElementById('update-id').value     = id;
  document.getElementById('update-desc').value   = desc;
  document.getElementById('update-status').value = status;
  updateModal.classList.add('open');
}
document.getElementById('closeModal').addEventListener('click', () => updateModal.classList.remove('open'));
updateModal.addEventListener('click', e => { if (e.target === updateModal) updateModal.classList.remove('open'); });

document.getElementById('updateComplaintForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id     = document.getElementById('update-id').value;
  const desc   = document.getElementById('update-desc').value.trim();
  const status = document.getElementById('update-status').value;
  try {
    await api('PUT', `/compl/update/${id}`, { description: desc, status });
    showToast(`Complaint #${id} updated!`, 'success');
    updateModal.classList.remove('open');
    loadComplaints(); loadDashboard();
  } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
});

// Delete Complaint
function confirmDeleteComplaint(id) {
  document.getElementById('confirmText').textContent = `Delete complaint #${id}? This cannot be undone.`;
  deleteCallback = async () => {
    try {
      await api('DELETE', `/compl/del/${id}`);
      showToast(`Complaint #${id} deleted`, 'success');
      loadComplaints(); loadDashboard();
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
document.getElementById('closeConfirmModal').addEventListener('click', () => { confirmModal.classList.remove('open'); deleteCallback = null; });
document.getElementById('cancelDelete').addEventListener('click',      () => { confirmModal.classList.remove('open'); deleteCallback = null; });
document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (deleteCallback) { await deleteCallback(); deleteCallback = null; }
  confirmModal.classList.remove('open');
});
confirmModal.addEventListener('click', e => { if (e.target === confirmModal) { confirmModal.classList.remove('open'); deleteCallback = null; } });

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
async function populateUserDropdown() {
  const sel = document.getElementById('comp-userid');
  sel.innerHTML = '<option value="">— Loading… —</option>';
  try {
    const users = await api('GET', '/user/all') || [];
    sel.innerHTML = users.length
      ? '<option value="">— Select a user —</option>' + users.map(u => `<option value="${u.id}">#${u.id} — ${escHtml(u.name)}</option>`).join('')
      : '<option value="">— No users found —</option>';
  } catch { sel.innerHTML = '<option value="">— Failed to load —</option>'; }
}

document.getElementById('createComplaintForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title  = document.getElementById('comp-title').value.trim();
  const desc   = document.getElementById('comp-desc').value.trim();
  const userId = parseInt(document.getElementById('comp-userid').value);
  if (!userId) { showToast('Please select a user', 'error'); return; }
  try {
    const r = await api('POST', '/compl/create', { title, description: desc, user: { id: userId } });
    showToast(`Complaint created! (ID: #${r?.id ?? '—'})`, 'success');
    e.target.reset(); await populateUserDropdown(); loadDashboard();
  } catch (err) { showToast('Failed: ' + err.message, 'error'); }
});

// ─── LOOKUP ───────────────────────────────────────────────────────────────────
document.getElementById('lookupUserBtn').addEventListener('click', lookupUser);
document.getElementById('lookup-user-id').addEventListener('keydown', e => { if (e.key === 'Enter') lookupUser(); });

async function lookupUser() {
  const id = parseInt(document.getElementById('lookup-user-id').value);
  if (!id) { showToast('Enter a User ID', 'info'); return; }
  const el   = document.getElementById('lookup-user-result');
  const wrap = document.getElementById('user-complaints-wrap');
  el.className  = 'lookup-result';
  el.innerHTML  = '<span class="spinner"></span> Fetching…';
  wrap.classList.add('hidden');
  try {
    const u = await api('GET', `/user/${id}`);
    if (!u?.id) throw new Error();
    el.innerHTML = `
      <div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#${u.id}</span></span></div>
      <div class="lr-row"><span class="lr-label">Name</span><span class="lr-value">${escHtml(u.name)}</span></div>
      <div class="lr-row"><span class="lr-label">Email</span><span class="lr-value">${escHtml(u.email)}</span></div>
      <div class="lr-actions">
        <button class="btn btn-sm btn-accent" onclick="openUpdateUserModal(${u.id},'${escAttr(u.name)}','${escAttr(u.email)}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-sm btn-ghost"  onclick="confirmDeleteUser(${u.id},'${escAttr(u.name)}')"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>`;
    const cs = await api('GET', `/compl/user/${id}`) || [];
    document.getElementById('user-complaints-title').textContent = `Complaints for ${u.name} (${cs.length})`;
    document.getElementById('user-complaints-body').innerHTML = cs.length
      ? cs.map(c => `<tr>
          <td><span class="id-chip">#${c.id}</span></td>
          <td>${escHtml(c.title)}</td>
          <td>${statusBadge(c.status)}</td>
          <td class="date-cell">${formatDate(c.createdAt)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">No complaints</td></tr>';
    wrap.classList.remove('hidden');
    showToast(`Found: ${u.name}`, 'success');
  } catch {
    el.className = 'lookup-result error';
    el.innerHTML = `<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No user found with ID #${id}</span></div>`;
  }
}

document.getElementById('lookupComplaintBtn').addEventListener('click', lookupComplaint);
document.getElementById('lookup-complaint-id').addEventListener('keydown', e => { if (e.key === 'Enter') lookupComplaint(); });

async function lookupComplaint() {
  const id = parseInt(document.getElementById('lookup-complaint-id').value);
  if (!id) { showToast('Enter a Complaint ID', 'info'); return; }
  const el = document.getElementById('lookup-complaint-result');
  el.className = 'lookup-result';
  el.innerHTML = '<span class="spinner"></span> Fetching…';
  try {
    const c = await api('GET', `/compl/${id}`);
    if (!c?.id) throw new Error();
    el.innerHTML = `
      <div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#${c.id}</span></span></div>
      <div class="lr-row"><span class="lr-label">Title</span><span class="lr-value" style="font-weight:600">${escHtml(c.title)}</span></div>
      <div class="lr-row"><span class="lr-label">Description</span><span class="lr-value">${escHtml(c.description)}</span></div>
      <div class="lr-row"><span class="lr-label">Status</span><span class="lr-value">${statusBadge(c.status)}</span></div>
      <div class="lr-row"><span class="lr-label">User</span><span class="lr-value">${c.user?.name ? escHtml(c.user.name) : (c.user?.id ?? '—')}</span></div>
      <div class="lr-row"><span class="lr-label">Created</span><span class="lr-value date-cell">${formatDate(c.createdAt)}</span></div>
      <div class="lr-actions">
        <button class="btn btn-sm btn-accent" onclick="openUpdateModal(${c.id},'${escAttr(c.description)}','${c.status}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-sm btn-ghost"  onclick="confirmDeleteComplaint(${c.id})"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>`;
    showToast(`Found complaint #${c.id}`, 'success');
  } catch {
    el.className = 'lookup-result error';
    el.innerHTML = `<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No complaint found with ID #${id}</span></div>`;
  }
}

// ─── DELETE BY STATUS ─────────────────────────────────────────────────────────
async function updateStatusPreview() {
  const status = document.getElementById('del-status').value;
  const el     = document.getElementById('status-preview-text');
  el.textContent = 'Counting…';
  try {
    const all   = await api('GET', '/compl/all') || [];
    const count = all.filter(c => c.status === status).length;
    el.textContent = `${count} complaint${count !== 1 ? 's' : ''} with status "${status}" will be permanently deleted.`;
  } catch { el.textContent = 'Could not load count.'; }
}
document.getElementById('del-status').addEventListener('change', updateStatusPreview);

document.getElementById('deleteByStatusForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = document.getElementById('del-status').value;
  document.getElementById('confirmText').textContent =
    document.getElementById('status-preview-text').textContent + ' Continue?';
  deleteCallback = async () => {
    try {
      await api('DELETE', `/compl/dele?status=${encodeURIComponent(status)}`);
      showToast(`All "${status}" complaints deleted`, 'success');
      loadDashboard(); updateStatusPreview();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/[\n\r]/g,' ');
}
function statusBadge(s) {
  if (s === 'OPEN')     return '<span class="badge badge-open">Open</span>';
  if (s === 'RESOLVED') return '<span class="badge badge-resolved">Resolved</span>';
  return `<span class="badge">${escHtml(s)}</span>`;
}
function formatDate(dt) {
  if (!dt) return '—';
  try {
    const d = Array.isArray(dt)
      ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0, dt[5]||0)
      : new Date(dt);
    return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return String(dt); }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadDashboard();
