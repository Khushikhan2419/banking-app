/* ---------------- Cheques — "Chequebook" theme ---------------- */
async function renderCheques() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  main.innerHTML = pageHeader("Cheques", "Issue & clear") + (mine ? `
    <div class="grid cols-2">
      <div class="card fade-in ch-leaf">
        <div class="ch-perf"></div>
        <h2>Issue a cheque</h2>
        <p class="hint">Funds only leave your account once it's cleared.</p>
        <label>Payee name</label><input id="ch_payee" placeholder="Payee name" />
        <label>Payee's account number (optional)</label><input id="ch_payee_account" placeholder="e.g. 48219047335 — leave blank if they're not a VeeraBank customer" />
        <label>Amount</label><input id="ch_amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
        <button class="btn" onclick="doIssueCheque()">Issue</button>
        <div id="ch_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your cheques</h2><div id="ch_list"><div class="empty">Loading…</div></div></div>
    </div>
  ` : noAccountCard("cheques"));
  if (mine) loadCheques();
}
async function doIssueCheque() {
  const el = document.getElementById("ch_msg");
  try {
    const body = {
      user_id: currentUser.user_id,
      account_id: cachedAccounts[0].account_id,
      payee_name: document.getElementById("ch_payee").value,
      amount: Number(document.getElementById("ch_amount").value),
    };
    const payeeAccount = document.getElementById("ch_payee_account").value.trim();
    if (payeeAccount) body.payee_account_number = payeeAccount;
    const c = await api("/cheques/issue", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Cheque #${c.cheque_number} issued.</div>`; toast("Cheque issued.");
    loadCheques();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadCheques() {
  const box = document.getElementById("ch_list");
  try {
    const items = await api(`/cheques/user/${currentUser.user_id}`);
    box.innerHTML = items.length ? items.map(c => row(
      `#${c.cheque_number} · ${c.payee_name} · $${fmtMoney(c.amount)}${c.payee_account_id ? ' <span class="badge">to account</span>' : ''}`,
      `${badge('', c.status)}${c.status === 'issued' ? ` <button class="btn ghost sm" onclick="doClearCheque('${c.id}')">Clear</button>` : ''}`,
      fmtWhen(c.created_at)
    )).join("") : `<div class="empty"><div class="big">No cheques yet</div>Issue your first one.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doClearCheque(id) {
  try { const c = await api(`/cheques/${id}/clear`, { method: "PATCH" }); toast(c.status === 'cleared' ? "Cheque cleared." : "Cheque bounced - insufficient funds."); loadCheques(); loadAccountsSilently(); }
  catch (e) { toast(e.message, false); }
}
