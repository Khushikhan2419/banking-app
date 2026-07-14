/* ---------------- Audit Log — "Blackbox Terminal" theme ---------------- */
async function renderAuditLog() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Audit Log", "Bank-wide activity trail") + `<div class="card fade-in al-crt"><div class="al-scanline"></div><div id="al_list"><div class="empty">Loading…</div></div></div>`;
  try {
    const items = await api(`/audit-log/all`);
    document.getElementById("al_list").innerHTML = items.length ? items.map(a => `
      <div class="al-line"><span class="al-caret">&gt;</span> <span class="al-action">${a.action.replace(/_/g,' ')}</span> <span class="al-when">${fmtWhen(a.created_at)}</span><div class="al-details">${JSON.stringify(a.details)}</div></div>
    `).join("") : `<div class="empty">Nothing logged yet.</div>`;
  } catch (e) { document.getElementById("al_list").innerHTML = `<div class="empty">${e.message}</div>`; }
}
