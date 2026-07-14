/* ---------------- Notifications — "Pulse Timeline" theme ---------------- */
async function renderNotifications() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Notifications", "What's new") + `<div class="card fade-in nt-card"><div class="nt-rail"><div id="nt_list"><div class="empty">Loading…</div></div></div></div>`;
  loadNotifications();
}
async function loadNotifications() {
  const box = document.getElementById("nt_list");
  try {
    const items = await api(`/notifications/user/${currentUser.user_id}`);
    box.innerHTML = items.length ? items.map(n => `
      <div class="nt-item ${n.read ? '' : 'unread'}">
        <div class="nt-dot"></div>
        <div class="nt-body">
          <div class="nt-subject">${n.subject}</div>
          <div class="nt-msg">${n.message}</div>
          <div class="nt-when">${fmtWhen(n.created_at)}</div>
        </div>
        ${n.read ? '' : `<button class="btn ghost sm" onclick="doMarkRead('${n.id}')">Mark read</button>`}
      </div>
    `).join("") : `<div class="empty"><div class="big">All caught up</div>No notifications.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doMarkRead(id) {
  try { await api(`/notifications/${id}/read`, { method: "PATCH" }); loadNotifications(); }
  catch (e) { toast(e.message, false); }
}
