/* ===========================
   ComplaintOS — script.js v5
   Full Fix — Event Delegation
   =========================== */

const BASE = "https://complaint-spring-mysql-1.onrender.com";

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────
let userRole = localStorage.getItem('clos-role') || 'USER';

const currentUser = {
  id: 1,
  name: userRole === 'ADMIN' ? 'Admin' : 'John Doe',
  email: userRole === 'ADMIN' ? 'admin@complaintos.com' : 'john@example.com',
  role: userRole,
  joined: 'Jan 2024'
};

// ─── State ────────────────────────────────────────────────────────────────────
let allComplaints = [];
let allUsers = [];
let deleteCallback = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const topbarTitle = document.getElementById('topbarTitle');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const roleSwitcher = document.getElementById('roleSwitcher');
const roleLabel = document.getElementById('roleLabel');
const toast = document.getElementById('toast');
const updateModal = document.getElementById('updateModal');
const updateUserModal = document.getElementById('updateUserModal');
const confirmModal = document.getElementById('confirmModal');
const viewModal = document.getElementById('viewModal');

// ─── THEME ────────────────────────────────────────────────────────────────────
const html = document.documentElement;
const savedTheme = localStorage.getItem('clos-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', function () {
  var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('clos-theme', next);
  updateThemeIcon(next);
  showToast('Switched to ' + next + ' mode', 'info');
});

function updateThemeIcon(theme) {
  themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// ─── BECOME ADMIN BAR (defined EARLY so applyRoleUI can call it) ──────────────
function updateBecomeAdminBar() {
  var bar = document.getElementById('becomeAdminBarUser');
  if (!bar) return;
  bar.style.display = userRole === 'USER' ? 'block' : 'none';
}

// ─── ROLE SWITCHER ────────────────────────────────────────────────────────────
roleSwitcher.addEventListener('click', function () {
  const modal = document.getElementById("adminLoginModal");
  if (modal) {
    modal.style.display = "flex";
  }
});

// ─── APPLY ROLE UI ────────────────────────────────────────────────────────────
function applyRoleUI() {
  var isAdmin = userRole === 'ADMIN';

  roleLabel.textContent = userRole;
  roleSwitcher.className = isAdmin ? 'role-switcher' : 'role-switcher user-role';

  document.getElementById('sidebar-role-label').textContent = isAdmin ? 'Admin Panel' : 'User Panel';
  document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('sidebar-username').textContent = currentUser.name;
  document.getElementById('sidebar-userrole').textContent = isAdmin ? 'System Administrator' : 'User';

  document.querySelectorAll('.admin-only').forEach(function (el) {
    el.classList.toggle('role-hidden', !isAdmin);
  });
  document.querySelectorAll('.admin-only-el').forEach(function (el) {
    el.classList.toggle('role-hidden', !isAdmin);
  });

  var adminOnlySections = ['users', 'lookup', 'delete-status'];
  var activeEl = document.querySelector('.section.active');
  var active = activeEl ? activeEl.id.replace('section-', '') : '';
  if (!isAdmin && adminOnlySections.indexOf(active) !== -1) {
    showSection('dashboard');
  }

  var welcomeEl = document.getElementById('dashboard-welcome');
  if (welcomeEl) {
    welcomeEl.textContent = isAdmin
      ? "Welcome back, Admin. Here's what's happening."
      : 'Welcome, ' + currentUser.name + '. Here are your complaint stats.';
  }

  updateBecomeAdminBar();
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
var toastTimer;
function showToast(msg, type) {
  type = type || 'success';
  clearTimeout(toastTimer);
  var icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  toast.className = 'toast show ' + type;
  toast.innerHTML = '<i class="fa-solid ' + (icons[type] || 'fa-circle-info') + '"></i><span>' + msg + '</span>';
  toastTimer = setTimeout(function () { toast.className = 'toast'; }, 3800);
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  var res = await fetch(BASE + path, opts);
  if (!res.ok) {
    var txt = await res.text().catch(function () { return ''; });
    throw new Error(txt || 'HTTP ' + res.status);
  }
  var text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch (e) { return text; }
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
var sectionTitles = {
  'dashboard': 'Dashboard',
  'users': 'User Management',
  'complaints': 'Complaints',
  'create-complaint': 'Create Complaint',
  'lookup': 'Lookup',
  'delete-status': 'Delete By Status',
  'profile': 'My Profile'
};

function showSection(id) {
  var adminOnly = ['users', 'lookup', 'delete-status'];
  if (userRole !== 'ADMIN' && adminOnly.indexOf(id) !== -1) {
    showAdminOnlyPopup();
    return;
  }
  document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });

  var sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
  var navItem = document.querySelector('.nav-item[data-section="' + id + '"]');
  if (navItem) navItem.classList.add('active');

  topbarTitle.textContent = sectionTitles[id] || id;
  sidebar.classList.remove('open');
  var bd = document.getElementById('sidebarBackdrop');
  if (bd) bd.classList.remove('show');

  if (id === 'dashboard') loadDashboard();
  if (id === 'users') loadUsers();
  if (id === 'complaints') loadComplaints();
  if (id === 'create-complaint') populateUserDropdown();
  if (id === 'delete-status') updateStatusPreview();
  if (id === 'profile') loadProfile();
}

document.querySelectorAll('.nav-item').forEach(function (item) {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    showSection(item.dataset.section);
  });
});
document.querySelectorAll('.link-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { showSection(btn.dataset.section); });
});

var profileBtn = document.getElementById('sidebarProfileBtn');
if (profileBtn) profileBtn.addEventListener('click', function () { showSection('profile'); });

// Mobile sidebar
var backdrop = document.createElement('div');
backdrop.id = 'sidebarBackdrop';
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);
menuToggle.addEventListener('click', function () { sidebar.classList.toggle('open'); backdrop.classList.toggle('show'); });
backdrop.addEventListener('click', function () { sidebar.classList.remove('open'); backdrop.classList.remove('show'); });

// Refresh
refreshBtn.addEventListener('click', function () {
  refreshBtn.classList.add('spinning');
  var activeEl = document.querySelector('.section.active');
  var active = activeEl ? activeEl.id.replace('section-', '') : '';
  if (active === 'dashboard') loadDashboard();
  if (active === 'users') loadUsers();
  if (active === 'complaints') loadComplaints();
  if (active === 'profile') loadProfile();
  setTimeout(function () { refreshBtn.classList.remove('spinning'); }, 800);
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    var results = await Promise.all([api('GET', '/compl/all'), api('GET', '/user/all')]);
    var complaints = results[0] || [];
    var users = results[1] || [];

    var totalC = complaints.length;
    var openC = complaints.filter(function (c) { return c.status === 'OPEN'; }).length;
    var resolC = complaints.filter(function (c) { return c.status === 'RESOLVED'; }).length;
    var totalU = users.length;

    animateCount('val-total-complaints', totalC);
    animateCount('val-open', openC);
    animateCount('val-resolved', resolC);
    animateCount('val-users', totalU);

    setTimeout(function () {
      var max = Math.max(totalC, 1);
      setBarWidth('bar-total', 100);
      setBarWidth('bar-open', Math.round((openC / max) * 100));
      setBarWidth('bar-resolved', Math.round((resolC / max) * 100));
      setBarWidth('bar-users', Math.min(totalU * 10, 100));
    }, 200);

    var pct = totalC > 0 ? Math.round((resolC / totalC) * 100) : 0;
    document.getElementById('res-pct').textContent = pct + '%';
    setTimeout(function () { document.getElementById('progress-bar').style.width = pct + '%'; }, 200);

    var rcBody = document.getElementById('recent-complaints-body');
    var recent = complaints.slice().reverse().slice(0, 5);
    rcBody.innerHTML = recent.length
      ? recent.map(function (c) {
        return '<tr><td><span class="id-chip">#' + c.id + '</span></td><td>' + escHtml(c.title) +
          '</td><td>' + statusBadge(c.status) + '</td><td>' +
          (c.user && c.user.name ? escHtml(c.user.name) : '—') + '</td></tr>';
      }).join('')
      : '<tr><td colspan="4" class="empty-row">No complaints yet</td></tr>';

    var ruBody = document.getElementById('recent-users-body');
    var recentU = users.slice().reverse().slice(0, 5);
    var isAdmin = userRole === 'ADMIN';
    ruBody.innerHTML = recentU.length
      ? recentU.map(function (u) {
        return '<tr><td><span class="id-chip">#' + u.id + '</span></td><td>' + escHtml(u.name) +
          '</td><td>' + (isAdmin ? escHtml(u.email) : '<span style="color:var(--text-dim);font-style:italic">Hidden</span>') + '</td></tr>';
      }).join('')
      : '<tr><td colspan="3" class="empty-row">No users yet</td></tr>';

  } catch (err) {
    showToast('Cannot connect to backend — is Spring Boot running on port 8080?', 'error');
    console.error(err);
  }
}

function setBarWidth(id, pct) { var el = document.getElementById(id); if (el) el.style.width = pct + '%'; }

function animateCount(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var val = 0;
  var step = Math.max(1, Math.ceil(target / 30));
  var timer = setInterval(function () {
    val = Math.min(val + step, target);
    el.textContent = val;
    if (val >= target) clearInterval(timer);
  }, 22);
}

// ─── USERS ────────────────────────────────────────────────────────────────────
async function loadUsers() {
  var tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="loading-row"><span class="spinner"></span> Loading...</td></tr>';
  try {
    allUsers = await api('GET', '/user/all') || [];
    renderUsersTable(allUsers);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Failed to load users</td></tr>';
    showToast('Could not fetch users', 'error');
  }
}

function renderUsersTable(users) {
  var tbody = document.getElementById('users-tbody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No users found</td></tr>'; return; }
  tbody.innerHTML = users.map(function (u) {
    return '<tr>' +
      '<td><span class="id-chip">#' + u.id + '</span></td>' +
      '<td style="font-weight:500;color:var(--text)">' + escHtml(u.name) + '</td>' +
      '<td>' + escHtml(u.email) + '</td>' +
      '<td><div class="action-group">' +
      '<button class="btn btn-icon btn-icon-edit" data-action="edit-user" data-id="' + u.id + '" data-name="' + escAttr(u.name) + '" data-email="' + escAttr(u.email) + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="btn btn-icon btn-icon-delete" data-action="delete-user" data-id="' + u.id + '" data-name="' + escAttr(u.name) + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

document.getElementById('registerUserForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var password = document.getElementById('reg-password').value.trim();
  try {
    await api('POST', '/user/register', { name: name, email: email, password: password });
    showToast('User "' + name + '" registered!', 'success');
    e.target.reset(); loadUsers();
  } catch (err) { showToast('Register failed: ' + err.message, 'error'); }
});

document.getElementById('refreshUsers').addEventListener('click', loadUsers);
document.getElementById('searchEmailBtn').addEventListener('click', searchByEmail);
document.getElementById('search-email').addEventListener('keydown', function (e) { if (e.key === 'Enter') searchByEmail(); });

async function searchByEmail() {
  var email = document.getElementById('search-email').value.trim();
  if (!email) { showToast('Enter an email', 'info'); return; }
  var el = document.getElementById('email-search-result');
  el.className = 'lookup-result';
  el.innerHTML = '<span class="spinner"></span> Searching…';
  try {
    var u = await api('GET', '/user/search?email=' + encodeURIComponent(email));
    if (!u || !u.id) throw new Error('not found');
    el.innerHTML =
      '<div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#' + u.id + '</span></span></div>' +
      '<div class="lr-row"><span class="lr-label">Name</span><span class="lr-value">' + escHtml(u.name) + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">Email</span><span class="lr-value">' + escHtml(u.email) + '</span></div>' +
      '<div class="lr-actions"><button class="btn btn-sm btn-accent" data-action="edit-user" data-id="' + u.id + '" data-name="' + escAttr(u.name) + '" data-email="' + escAttr(u.email) + '"><i class="fa-solid fa-pen"></i> Edit</button></div>';
    showToast('Found: ' + u.name, 'success');
  } catch (err) {
    el.className = 'lookup-result error';
    el.innerHTML = '<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No user found with that email</span></div>';
  }
}

function openUpdateUserModal(id, name, email) {
  document.getElementById('upd-user-id').value = id;
  document.getElementById('upd-user-name').value = name;
  document.getElementById('upd-user-email').value = email;
  document.getElementById('upd-user-pass').value = '';
  updateUserModal.classList.add('open');
}
document.getElementById('closeUpdateUserModal').addEventListener('click', function () { updateUserModal.classList.remove('open'); });
updateUserModal.addEventListener('click', function (e) { if (e.target === updateUserModal) updateUserModal.classList.remove('open'); });

document.getElementById('updateUserForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var id = parseInt(document.getElementById('upd-user-id').value);
  var name = document.getElementById('upd-user-name').value.trim();
  var email = document.getElementById('upd-user-email').value.trim();
  var pass = document.getElementById('upd-user-pass').value.trim();
  if (!pass) { showToast('Password is required', 'error'); return; }
  try {
    await api('PUT', '/user/update', { id: id, name: name, email: email, password: pass });
    showToast('User #' + id + ' updated!', 'success');
    updateUserModal.classList.remove('open');
    loadUsers(); loadDashboard();
  } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
});

function confirmDeleteUser(id, name) {
  document.getElementById('confirmText').textContent = 'Delete user "' + name + '" (ID #' + id + ')? This cannot be undone.';
  deleteCallback = async function () {
    try {
      await api('DELETE', '/user/del/' + id);
      showToast('User #' + id + ' deleted', 'success');
      loadUsers(); loadDashboard();
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
}

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────
async function loadComplaints() {
  var tbody = document.getElementById('complaints-tbody');
  var isAdmin = userRole === 'ADMIN';
  var cols = isAdmin ? 8 : 7;
  tbody.innerHTML = '<tr><td colspan="' + cols + '" class="loading-row"><span class="spinner"></span> Loading…</td></tr>';
  try {
    allComplaints = await api('GET', '/compl/all') || [];
    renderComplaintsTable(allComplaints);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="' + cols + '" class="empty-row">Failed to load complaints</td></tr>';
    showToast('Could not fetch complaints', 'error');
  }
}

function renderComplaintsTable(list) {
  var tbody = document.getElementById('complaints-tbody');
  var isAdmin = userRole === 'ADMIN';
  var cols = isAdmin ? 8 : 7;
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="' + cols + '" class="empty-row">No complaints found</td></tr>'; return; }
  tbody.innerHTML = list.map(function (c) {
    var emailCol = isAdmin ? '<td style="font-size:12px;color:var(--text-2)">' + (c.user && c.user.email ? escHtml(c.user.email) : '—') + '</td>' : '';
    var deleteBtn = isAdmin ? '<button class="btn btn-icon btn-icon-delete" data-action="delete-complaint" data-id="' + c.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' : '';
    return '<tr>' +
      '<td><span class="id-chip">#' + c.id + '</span></td>' +
      '<td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:var(--text)">' + escHtml(c.title) + '</td>' +
      '<td class="desc-cell">' + escHtml(c.description) + '</td>' +
      '<td>' + statusBadge(c.status) + '</td>' +
      '<td>' + (c.user && c.user.name ? escHtml(c.user.name) : '—') + '</td>' +
      emailCol +
      '<td class="date-cell">' + formatDate(c.createdAt) + '</td>' +
      '<td><div class="action-group">' +
      '<button class="btn btn-icon btn-icon-view" data-action="view-complaint" data-id="' + c.id + '" title="View"><i class="fa-solid fa-eye"></i></button>' +
      '<button class="btn btn-icon btn-icon-edit" data-action="edit-complaint" data-id="' + c.id + '" data-desc="' + escAttr(c.description) + '" data-status="' + c.status + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
      deleteBtn +
      '</div></td></tr>';
  }).join('');
}

document.getElementById('complaintSearch').addEventListener('input', applyComplaintFilters);
document.getElementById('statusFilter').addEventListener('change', applyComplaintFilters);
document.getElementById('refreshComplaints').addEventListener('click', loadComplaints);

function applyComplaintFilters() {
  var s = document.getElementById('complaintSearch').value.toLowerCase();
  var status = document.getElementById('statusFilter').value;
  renderComplaintsTable(allComplaints.filter(function (c) {
    return (!s || (c.title && c.title.toLowerCase().indexOf(s) !== -1) || (c.description && c.description.toLowerCase().indexOf(s) !== -1)) &&
      (!status || c.status === status);
  }));
}

async function openViewModal(id) {
  var body = document.getElementById('complaint-detail-body');
  var isAdmin = userRole === 'ADMIN';
  body.innerHTML = '<div style="padding:24px;text-align:center"><span class="spinner"></span></div>';
  viewModal.classList.add('open');
  try {
    var c = await api('GET', '/compl/' + id);
    var emailRow = isAdmin ? '<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">' + (c.user && c.user.email ? escHtml(c.user.email) : '—') + '</span></div>' : '';
    var deleteBtn = isAdmin ? '<button class="btn btn-ghost btn-sm" data-action="delete-complaint" data-id="' + c.id + '" data-close-view="1"><i class="fa-solid fa-trash"></i> Delete</button>' : '';
    body.innerHTML =
      '<div class="detail-row"><span class="detail-label">ID</span><span class="detail-value"><span class="id-chip">#' + c.id + '</span></span></div>' +
      '<div class="detail-divider"></div>' +
      '<div class="detail-row"><span class="detail-label">Title</span><span class="detail-value" style="font-weight:700;font-size:16px">' + escHtml(c.title) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Description</span><span class="detail-value desc">' + escHtml(c.description) + '</span></div>' +
      '<div class="detail-divider"></div>' +
      '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">' + statusBadge(c.status) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">User</span><span class="detail-value">' + (c.user && c.user.name ? escHtml(c.user.name) : '—') + '</span></div>' +
      emailRow +
      '<div class="detail-row"><span class="detail-label">Created</span><span class="detail-value date-cell">' + formatDate(c.createdAt) + '</span></div>' +
      '<div class="detail-divider"></div>' +
      '<div style="display:flex;gap:8px;padding-bottom:2px">' +
      '<button class="btn btn-accent btn-sm" data-action="edit-complaint" data-id="' + c.id + '" data-desc="' + escAttr(c.description) + '" data-status="' + c.status + '" data-close-view="1"><i class="fa-solid fa-pen"></i> Edit</button>' +
      deleteBtn +
      '<button class="btn btn-ghost btn-sm" data-action="close-view"><i class="fa-solid fa-xmark"></i> Close</button>' +
      '</div>';
  } catch (err) {
    body.innerHTML = '<div style="padding:24px;color:var(--red)">Failed to load complaint #' + id + '</div>';
  }
}

document.getElementById('closeViewModal').addEventListener('click', function () { viewModal.classList.remove('open'); });
viewModal.addEventListener('click', function (e) { if (e.target === viewModal) viewModal.classList.remove('open'); });

function openUpdateModal(id, desc, status) {
  document.getElementById('update-id').value = id;
  document.getElementById('update-desc').value = desc;
  document.getElementById('update-status').value = status;
  var statusGroup = document.getElementById('update-status-group');
  if (statusGroup) statusGroup.classList.toggle('role-hidden', userRole !== 'ADMIN');
  updateModal.classList.add('open');
}

document.getElementById('closeModal').addEventListener('click', function () { updateModal.classList.remove('open'); });
updateModal.addEventListener('click', function (e) { if (e.target === updateModal) updateModal.classList.remove('open'); });

document.getElementById('updateComplaintForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var id = document.getElementById('update-id').value;
  var desc = document.getElementById('update-desc').value.trim();
  var body = { description: desc };
  if (userRole === 'ADMIN') {
    body.status = document.getElementById('update-status').value;
  }
  try {
    await api('PUT', '/compl/update/' + id, body);
    showToast('Complaint #' + id + ' updated!', 'success');
    updateModal.classList.remove('open');
    loadComplaints(); loadDashboard();
  } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
});

function confirmDeleteComplaint(id) {
  if (userRole !== 'ADMIN') { showToast('Only admins can delete complaints', 'error'); return; }
  document.getElementById('confirmText').textContent = 'Delete complaint #' + id + '? This cannot be undone.';
  deleteCallback = async function () {
    try {
      await api('DELETE', '/compl/del/' + id + '?role=ADMIN');
      showToast('Complaint #' + id + ' deleted', 'success');
      loadComplaints(); loadDashboard();
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
document.getElementById('closeConfirmModal').addEventListener('click', function () { confirmModal.classList.remove('open'); deleteCallback = null; });
document.getElementById('cancelDelete').addEventListener('click', function () { confirmModal.classList.remove('open'); deleteCallback = null; });
document.getElementById('confirmDelete').addEventListener('click', async function () {
  if (deleteCallback) { await deleteCallback(); deleteCallback = null; }
  confirmModal.classList.remove('open');
});
confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) { confirmModal.classList.remove('open'); deleteCallback = null; } });

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
async function populateUserDropdown() {
  var sel = document.getElementById('comp-userid');
  sel.innerHTML = '<option value="">— Loading… —</option>';
  try {
    var users = await api('GET', '/user/all') || [];
    sel.innerHTML = users.length
      ? '<option value="">— Select a user —</option>' + users.map(function (u) { return '<option value="' + u.id + '">#' + u.id + ' — ' + escHtml(u.name) + '</option>'; }).join('')
      : '<option value="">— No users found —</option>';
  } catch (err) { sel.innerHTML = '<option value="">— Failed to load —</option>'; }
}

document.getElementById('createComplaintForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var title = document.getElementById('comp-title').value.trim();
  var desc = document.getElementById('comp-desc').value.trim();
  var userId = parseInt(document.getElementById('comp-userid').value);
  if (!userId) { showToast('Please select a user', 'error'); return; }
  try {
    var r = await api('POST', '/compl/create', { title: title, description: desc, user: { id: userId } });
    showToast('Complaint created! (ID: #' + (r && r.id ? r.id : '—') + ')', 'success');
    e.target.reset(); populateUserDropdown(); loadDashboard();
  } catch (err) { showToast('Failed: ' + err.message, 'error'); }
});

// ─── LOOKUP ───────────────────────────────────────────────────────────────────
document.getElementById('lookupUserBtn').addEventListener('click', lookupUser);
document.getElementById('lookup-user-id').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookupUser(); });

async function lookupUser() {
  var id = parseInt(document.getElementById('lookup-user-id').value);
  if (!id) { showToast('Enter a User ID', 'info'); return; }
  var el = document.getElementById('lookup-user-result');
  var wrap = document.getElementById('user-complaints-wrap');
  el.className = 'lookup-result';
  el.innerHTML = '<span class="spinner"></span> Fetching…';
  wrap.classList.add('hidden');
  try {
    var u = await api('GET', '/user/' + id);
    if (!u || !u.id) throw new Error('not found');
    el.innerHTML =
      '<div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#' + u.id + '</span></span></div>' +
      '<div class="lr-row"><span class="lr-label">Name</span><span class="lr-value">' + escHtml(u.name) + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">Email</span><span class="lr-value">' + escHtml(u.email) + '</span></div>' +
      '<div class="lr-actions">' +
      '<button class="btn btn-sm btn-accent" data-action="edit-user" data-id="' + u.id + '" data-name="' + escAttr(u.name) + '" data-email="' + escAttr(u.email) + '"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button class="btn btn-sm btn-ghost" data-action="delete-user" data-id="' + u.id + '" data-name="' + escAttr(u.name) + '"><i class="fa-solid fa-trash"></i> Delete</button>' +
      '</div>';
    var cs = await api('GET', '/compl/user/' + id) || [];
    document.getElementById('user-complaints-title').textContent = 'Complaints for ' + u.name + ' (' + cs.length + ')';
    document.getElementById('user-complaints-body').innerHTML = cs.length
      ? cs.map(function (c) {
        return '<tr><td><span class="id-chip">#' + c.id + '</span></td><td>' + escHtml(c.title) + '</td><td>' + statusBadge(c.status) + '</td><td class="date-cell">' + formatDate(c.createdAt) + '</td></tr>';
      }).join('')
      : '<tr><td colspan="4" class="empty-row">No complaints</td></tr>';
    wrap.classList.remove('hidden');
    showToast('Found: ' + u.name, 'success');
  } catch (err) {
    el.className = 'lookup-result error';
    el.innerHTML = '<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No user found with ID #' + id + '</span></div>';
  }
}

document.getElementById('lookupComplaintBtn').addEventListener('click', lookupComplaint);
document.getElementById('lookup-complaint-id').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookupComplaint(); });

async function lookupComplaint() {
  var id = parseInt(document.getElementById('lookup-complaint-id').value);
  if (!id) { showToast('Enter a Complaint ID', 'info'); return; }
  var el = document.getElementById('lookup-complaint-result');
  el.className = 'lookup-result';
  el.innerHTML = '<span class="spinner"></span> Fetching…';
  try {
    var c = await api('GET', '/compl/' + id);
    if (!c || !c.id) throw new Error('not found');
    el.innerHTML =
      '<div class="lr-row"><span class="lr-label">ID</span><span class="lr-value"><span class="id-chip">#' + c.id + '</span></span></div>' +
      '<div class="lr-row"><span class="lr-label">Title</span><span class="lr-value" style="font-weight:600">' + escHtml(c.title) + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">Description</span><span class="lr-value">' + escHtml(c.description) + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">Status</span><span class="lr-value">' + statusBadge(c.status) + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">User</span><span class="lr-value">' + (c.user && c.user.name ? escHtml(c.user.name) : '—') + '</span></div>' +
      '<div class="lr-row"><span class="lr-label">Created</span><span class="lr-value date-cell">' + formatDate(c.createdAt) + '</span></div>' +
      '<div class="lr-actions">' +
      '<button class="btn btn-sm btn-accent" data-action="edit-complaint" data-id="' + c.id + '" data-desc="' + escAttr(c.description) + '" data-status="' + c.status + '"><i class="fa-solid fa-pen"></i> Edit</button>' +
      '<button class="btn btn-sm btn-ghost" data-action="delete-complaint" data-id="' + c.id + '"><i class="fa-solid fa-trash"></i> Delete</button>' +
      '</div>';
    showToast('Found complaint #' + c.id, 'success');
  } catch (err) {
    el.className = 'lookup-result error';
    el.innerHTML = '<div class="lr-row"><span class="lr-label">Result</span><span class="lr-value" style="color:var(--red)">No complaint found with ID #' + id + '</span></div>';
  }
}

// ─── DELETE BY STATUS ─────────────────────────────────────────────────────────
async function updateStatusPreview() {
  var status = document.getElementById('del-status').value;
  var el = document.getElementById('status-preview-text');
  el.textContent = 'Counting…';
  try {
    var all = await api('GET', '/compl/all') || [];
    var count = all.filter(function (c) { return c.status === status; }).length;
    el.textContent = count + ' complaint' + (count !== 1 ? 's' : '') + ' with status "' + status + '" will be permanently deleted.';
  } catch (err) { el.textContent = 'Could not load count.'; }
}
document.getElementById('del-status').addEventListener('change', updateStatusPreview);

document.getElementById('deleteByStatusForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var status = document.getElementById('del-status').value;
  document.getElementById('confirmText').textContent = document.getElementById('status-preview-text').textContent + ' Continue?';
  deleteCallback = async function () {
    try {
      await api('DELETE', '/compl/dele?status=' + encodeURIComponent(status) + '&role=ADMIN');
      showToast('All "' + status + '" complaints deleted', 'success');
      loadDashboard(); updateStatusPreview();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };
  confirmModal.classList.add('open');
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
async function loadProfile() {
  var isAdmin = userRole === 'ADMIN';
  var avatarBig = document.getElementById('profile-avatar-big');
  if (avatarBig) avatarBig.textContent = currentUser.name.charAt(0).toUpperCase();
  var badge = document.getElementById('profile-role-badge');
  if (badge) { badge.textContent = userRole; badge.className = isAdmin ? 'profile-badge' : 'profile-badge user-badge'; }
  setText('profile-name', currentUser.name);
  setText('profile-email-display', currentUser.email);
  setText('profile-joined', currentUser.joined || '—');
  setText('pf-name', currentUser.name);
  setText('pf-email', currentUser.email);
  setText('pf-role', userRole);
  setText('pf-id', '#' + currentUser.id);
  try {
    var complaints = await api('GET', '/compl/all') || [];
    var mine = isAdmin ? complaints : complaints.filter(function (c) { return c.user && c.user.id === currentUser.id; });
    setText('ps-complaints', mine.length);
    setText('ps-open', mine.filter(function (c) { return c.status === 'OPEN'; }).length);
    setText('ps-resolved', mine.filter(function (c) { return c.status === 'RESOLVED'; }).length);
  } catch (err) { ['ps-complaints', 'ps-open', 'ps-resolved'].forEach(function (id) { setText(id, '—'); }); }

  var perms = isAdmin ? [
    { label: 'View all complaints', allowed: true },
    { label: 'Create complaints', allowed: true },
    { label: 'Edit complaint description', allowed: true },
    { label: 'Change complaint status', allowed: true },
    { label: 'Delete complaints', allowed: true },
    { label: 'View user emails', allowed: true },
    { label: 'Manage users', allowed: true },
    { label: 'Bulk delete by status', allowed: true }
  ] : [
    { label: 'View all complaints', allowed: true },
    { label: 'Create complaints', allowed: true },
    { label: 'Edit complaint description', allowed: true },
    { label: 'Change complaint status', allowed: false },
    { label: 'Delete complaints', allowed: false },
    { label: 'View user emails', allowed: false },
    { label: 'Manage users', allowed: false },
    { label: 'Bulk delete by status', allowed: false }
  ];
  var permList = document.getElementById('permissions-list');
  if (permList) {
    permList.innerHTML = perms.map(function (p) {
      return '<div class="perm-item"><div class="perm-icon ' + (p.allowed ? 'perm-allowed' : 'perm-denied') + '"><i class="fa-solid ' + (p.allowed ? 'fa-check' : 'fa-xmark') + '"></i></div><span class="perm-text"><strong>' + p.label + '</strong></span></div>';
    }).join('');
  }
}

function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

// ─── GLOBAL EVENT DELEGATION ──────────────────────────────────────────────────
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.dataset.action;
  var id = btn.dataset.id ? parseInt(btn.dataset.id) : null;
  var name = btn.dataset.name || '';
  var email = btn.dataset.email || '';
  var desc = btn.dataset.desc || '';
  var status = btn.dataset.status || '';
  if (btn.dataset.closeView) viewModal.classList.remove('open');
  var adminActions = ['edit-user', 'delete-user', 'delete-complaint'];
  if (userRole !== 'ADMIN' && adminActions.indexOf(action) !== -1) {
    showAdminOnlyPopup();
    return;
  }
  switch (action) {
    case 'edit-user': openUpdateUserModal(id, name, email); break;
    case 'delete-user': confirmDeleteUser(id, name); break;
    case 'view-complaint': openViewModal(id); break;
    case 'edit-complaint': openUpdateModal(id, desc, status); break;
    case 'delete-complaint': confirmDeleteComplaint(id); break;
    case 'close-view': viewModal.classList.remove('open'); break;
  }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ').replace(/\r/g, ' ');
}
function statusBadge(s) {
  if (s === 'OPEN') return '<span class="badge badge-open">Open</span>';
  if (s === 'RESOLVED') return '<span class="badge badge-resolved">Resolved</span>';
  return '<span class="badge">' + escHtml(s) + '</span>';
}
function formatDate(dt) {
  if (!dt) return '—';
  try {
    var d = Array.isArray(dt)
      ? new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0)
      : new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return String(dt); }
}

// ─── BECOME ADMIN BAR ────────────────────────────────────────────────────────
var becomeAdminMsgs = [
  { emoji: '😂', title: 'Hahahaha NAHI!', msg: 'Tu ADMIN? Bhai pehle school complete kar! 😂' },
  { emoji: '🤣', title: 'Nice Try Bro!', msg: 'Tera application review ma che... REJECT! 🤣 Better luck next life!' },
  { emoji: '💀', title: 'RIP Tari Umeed!', msg: 'ADMIN access? Tane sapnama pan nahi milse bhai 💀 Chal User bani rah!' },
  { emoji: '🙃', title: 'Interesting Attempt!', msg: 'Wah wah wah... himmat to dekho! Par ADMIN nathi banvanu tane 🙃' },
  { emoji: '😤', title: 'EK KAAM KAR!', msg: 'Pehle apni complaints resolve karva de, pachhi ADMIN ni vaato karje 😤' },
  { emoji: '🐸', title: 'Dadur na Sapna!', msg: 'ADMIN banne ke sapne dekh raha hai? Bhai ye sapna hi rehega 🐸 Ribbit!' },
  { emoji: '👻', title: 'Boo! Still USER!', msg: 'Ghost bani ne aavyo? Haji pan USER j che tu bhai 👻 Boo yourself!' },
];

var becomeAdminEmojiList = ['😈', '🤡', '👿', '🙈', '💀', '🐒', '😏', '🔥'];
var emojiIdx = 0;

function initBecomeAdminBar() {
  var bar = document.getElementById('becomeAdminBarUser');
  if (!bar) return;

  setInterval(function () {
    emojiIdx = (emojiIdx + 1) % becomeAdminEmojiList.length;
    var el = document.getElementById('becomeAdminEmoji');
    if (el) el.textContent = becomeAdminEmojiList[emojiIdx];
  }, 2000);

  var btn = document.getElementById('becomeAdminBtn');
  if (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var msg = becomeAdminMsgs[Math.floor(Math.random() * becomeAdminMsgs.length)];
      showBecomeAdminPopup(msg);
    });
  }
}

function showBecomeAdminPopup(msg) {
  var existing = document.getElementById('become-admin-popup');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'become-admin-popup';
  overlay.innerHTML =
    '<div class="funny-box">' +
    '<div class="funny-emoji" style="animation:evilFloat 0.5s ease-in-out infinite alternate">' + msg.emoji + '</div>' +
    '<div class="funny-title" style="font-size:26px">' + msg.title + '</div>' +
    '<div class="funny-msg" style="font-size:17px;line-height:1.7">' + msg.msg + '</div>' +
    '<div class="funny-sub" style="font-size:14px">💡 Role Switcher thi ADMIN bani shakay che — demo mate only!</div>' +
    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
    '<button class="funny-btn" id="become-close-btn">Thik che bhai 😭</button>' +
    '<button class="funny-btn" style="background:var(--bg);color:var(--accent);border:1px solid var(--accent)" id="become-switch-btn">Switch to ADMIN 😎</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(function () { overlay.classList.add('show'); });

  document.getElementById('become-close-btn').addEventListener('click', function () {
    overlay.classList.remove('show');
    setTimeout(function () { overlay.remove(); }, 300);
  });

  // ★ Switch to ADMIN — funny denial, real switch nai
  document.getElementById('become-switch-btn').addEventListener('click', function () {
    overlay.classList.remove('show');
    setTimeout(function () {
      overlay.remove();
      var deny = document.createElement('div');
      deny.id = 'become-admin-popup';
      deny.innerHTML =
        '<div class="funny-box">' +
        '<div class="funny-emoji" style="font-size:80px;animation:funnyBounce 0.5s ease infinite alternate">🤣</div>' +
        '<div class="funny-title" style="font-size:26px;color:var(--red)">Dofa na to padi tane!</div>' +
        '<div class="funny-msg" style="font-size:17px;line-height:1.8">Khaber bathi padti... 😂<br>Ja Dhruv sir kane permission lai av!<br>Pachhi ADMIN banvaanu joiye! 🙏</div>' +
        '<div class="funny-sub" style="font-size:14px">🔐 Sir ni permission vinaa ADMIN? Sapnu j reh bhai!</div>' +
        '<button class="funny-btn" id="deny-close-btn" style="font-size:15px;padding:12px 32px">Jokes a Part 😅</button>' +
        '</div>';
      document.body.appendChild(deny);
      requestAnimationFrame(function () { deny.classList.add('show'); });
      document.getElementById('deny-close-btn').addEventListener('click', function () {
        deny.classList.remove('show');
        setTimeout(function () { deny.remove(); }, 300);
      });
      deny.addEventListener('click', function (e) {
        if (e.target === deny) { deny.classList.remove('show'); setTimeout(function () { deny.remove(); }, 300); }
      });
      setTimeout(function () {
        var el = document.getElementById('become-admin-popup');
        if (el) { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }
      }, 8000);
    }, 300);
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) { overlay.classList.remove('show'); setTimeout(function () { overlay.remove(); }, 300); }
  });
  setTimeout(function () {
    var el = document.getElementById('become-admin-popup');
    if (el) { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }
  }, 8000);
}

// ─── FUNNY ADMIN-ONLY POPUP ───────────────────────────────────────────────────
var funnyMessages = [
  { emoji: '🤡', title: 'Aye aye aye!', msg: 'Tu ADMIN nathi bhai! Aa button tara baap mate che 😂' },
  { emoji: '🚫', title: 'Nope Nope Nope!', msg: 'USER che tu, superhero nahi! ADMIN ne bhane pehla 🦸' },
  { emoji: '🙈', title: 'Aankh band kar!', msg: 'Aa section jovaano adhikar j nathi tane... sharam kar thodi 😅' },
  { emoji: '💀', title: 'RIP Attempt!', msg: 'Tari permission yahan khatam thay che. ADMIN banya pachhi aaje 💀' },
  { emoji: '🐒', title: 'Banana le ja!', msg: 'Bhai ADMIN nathi to aa button press karvano try mat kar 🍌' },
  { emoji: '😤', title: 'Himmat toh dekho!', msg: 'USER chhe ane ADMIN wali harkat? Bahut na insaafi! 😤' },
  { emoji: '🔒', title: 'Taalu lagai didhu!', msg: 'Aa door ADMIN mate j khule che. Tara mate? Nahi bhai nahi! 🔑' },
  { emoji: '👮', title: 'Security Alert!', msg: 'Bhai ruk ek second... tu kaun hota hai yahan aane wala? 🚨' }
];

function showAdminOnlyPopup() {
  var msg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
  var existing = document.getElementById('admin-funny-popup');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'admin-funny-popup';
  overlay.innerHTML =
    '<div class="funny-box">' +
    '<div class="funny-emoji">' + msg.emoji + '</div>' +
    '<div class="funny-title">' + msg.title + '</div>' +
    '<div class="funny-msg">' + msg.msg + '</div>' +
    '<div class="funny-sub">🔐 Sirf ADMIN j aa kaam kari shake che!</div>' +
    '<button class="funny-btn" id="funny-close-btn">Haa bhai samjai 😅</button>' +
    '</div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(function () { overlay.classList.add('show'); });

  document.getElementById('funny-close-btn').addEventListener('click', function () {
    overlay.classList.remove('show');
    setTimeout(function () { overlay.remove(); }, 300);
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) { overlay.classList.remove('show'); setTimeout(function () { overlay.remove(); }, 300); }
  });
  setTimeout(function () {
    var el = document.getElementById('admin-funny-popup');
    if (el) { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }
  }, 5000);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
applyRoleUI();
loadDashboard();
initBecomeAdminBar();

/* ADMIN LOGIN SYSTEM */

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username = document.getElementById("adminUser").value;
    const password = document.getElementById("adminPass").value;

    const res = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {

      localStorage.setItem("clos-role", "ADMIN");

      const modal = document.getElementById("adminLoginModal");
      modal.style.display = "none";

      location.reload();

    } else {
      alert("Invalid Admin Credentials");
    }

  });
}