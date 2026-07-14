/* ---------------- Fixed Deposits — "Vault Gold" theme ---------------- */
async function renderFixedDeposits() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  main.innerHTML = pageHeader("Fixed Deposits", "Lock in a rate") + `
    <div class="fd-seal">◒ 6.5% P.A. · VAULT-GRADE ASSURANCE</div>
  ` + (mine ? `
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Open a fixed deposit</h2>
        <p class="hint">6.5% p.a. · balance $${fmtMoney(mine.balance)}</p>
        <label>Principal</label><input id="fd_principal" type="number" min="1" step="0.01" placeholder="5000" />
        <label>Tenure (months)</label><input id="fd_tenure" type="number" min="1" max="120" value="12" />
        <button class="btn" onclick="doOpenFd()">Open FD</button>
        <div id="fd_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your fixed deposits</h2><div id="fd_list"><div class="empty">Loading…</div></div></div>
    </div>
  ` : noAccountCard("fixed deposits"));
  if (mine) loadFds();
}
async function doOpenFd() {
  const el = document.getElementById("fd_msg");
  try {
    const body = { user_id: currentUser.user_id, account_id: cachedAccounts[0].account_id, principal: Number(document.getElementById("fd_principal").value), tenure_months: Number(document.getElementById("fd_tenure").value) };
    const fd = await api("/fixed-deposits", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Opened. Matures ${fd.maturity_date} at $${fmtMoney(fd.maturity_amount)}.</div>`; toast("FD opened.");
    loadFds(); loadAccountsSilently();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadFds() {
  const box = document.getElementById("fd_list");
  try {
    const fds = await api(`/fixed-deposits/user/${currentUser.user_id}`);
    box.innerHTML = fds.length ? fds.map(f => row(
      `$${fmtMoney(f.principal)} → $${fmtMoney(f.maturity_amount)}`,
      `${badge('', f.status)}${f.status === 'active' ? ` <button class="btn ghost sm" onclick="doCloseFd('${f.id}')">Close</button>` : ''}`,
      `Matures ${f.maturity_date}`
    )).join("") : `<div class="empty"><div class="big">No FDs yet</div>Open your first one.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doCloseFd(id) {
  try { const fd = await api(`/fixed-deposits/${id}/close`, { method: "PATCH" }); toast(`Closed · paid out $${fmtMoney(fd.payout_amount)}.`); loadFds(); loadAccountsSilently(); }
  catch (e) { toast(e.message, false); }
}
