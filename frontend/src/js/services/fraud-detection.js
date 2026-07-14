/* ---------------- Fraud Detection — "Red Alert" theme ---------------- */
async function renderFraudDetection() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Fraud Detection", "Auto-flagged transfers") + `
    <div class="fr-radar"><span class="fr-pulse"></span>MONITORING LIVE TRANSFER STREAM</div>
    <div class="card fade-in"><div id="fr_list"><div class="empty">Loading…</div></div></div>
  `;
  loadFraudFlags();
}
async function loadFraudFlags() {
  try {
    const items = await api(`/fraud-detection/flags`);
    document.getElementById("fr_list").innerHTML = items.length ? items.map(f => row(
      `$${fmtMoney(f.amount)} · ${f.reason}`, `${badge('', f.status)}${f.status === 'open' ? ` <button class="btn ghost sm" onclick="doClearFlag('${f.id}')">Clear</button>` : ''}`, fmtWhen(f.created_at)
    )).join("") : `<div class="empty"><div class="big">No flags</div>Nothing suspicious yet.</div>`;
  } catch (e) { document.getElementById("fr_list").innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doClearFlag(id) {
  try { await api(`/fraud-detection/flags/${id}/clear`, { method: "PATCH" }); toast("Flag cleared."); loadFraudFlags(); }
  catch (e) { toast(e.message, false); }
}
