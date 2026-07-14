/* ---------------- Reports — "Analytics Studio" theme ---------------- */
async function renderReports() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Reports", "Bank-wide analytics") + `<div class="rp-strip">▦ ANALYTICS STUDIO · LIVE FIGURES</div><div class="grid cols-3" id="rp_grid"><div class="empty">Loading…</div></div>`;
  try {
    const r = await api("/reports/summary");
    document.getElementById("rp_grid").innerHTML = [
      ["Total accounts", r.total_accounts], ["Total balance", "$" + fmtMoney(r.total_balance_across_bank)],
      ["Total transfers", r.total_transfers], ["Transfer volume", "$" + fmtMoney(r.total_transfer_volume)],
      ["Avg transfer", "$" + fmtMoney(r.average_transfer_amount)], ["Largest balance", "$" + fmtMoney(r.largest_account_balance)],
    ].map(([l,v]) => `<div class="card fade-in stat-tile"><div class="label">${l.toUpperCase()}</div><div class="value">${v}</div></div>`).join("");
  } catch (e) { document.getElementById("rp_grid").innerHTML = `<div class="empty">${e.message}</div>`; }
}
