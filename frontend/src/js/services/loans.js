/* ---------------- Loans — "Editorial Ledger" theme ---------------- */
async function renderLoans() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  main.innerHTML = pageHeader("Loans", "Apply & track") + `
    <div class="loans-masthead">
      <div class="loans-masthead-rule"></div>
      <div class="loans-masthead-row">
        <span>VOL. I · CREDIT DESK</span><span id="ln_stamp">${new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span>
      </div>
      <div class="loans-masthead-rule"></div>
    </div>
  ` + (mine ? `
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Apply for a loan</h2>
        <p class="hint">Under $500,000 auto-approves and disburses instantly.</p>
        <label>Principal</label><input id="ln_principal" type="number" min="1" step="0.01" placeholder="10000" />
        <label>Tenure (months)</label><input id="ln_tenure" type="number" min="1" max="360" value="12" />
        <label>Purpose</label><input id="ln_purpose" placeholder="Home renovation" />
        <button class="btn" onclick="doApplyLoan()">Apply</button>
        <div id="ln_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your loans</h2><div id="ln_list"><div class="empty">Loading…</div></div></div>
    </div>
  ` : noAccountCard("loans"));
  if (mine) loadLoans();
}
async function doApplyLoan() {
  const el = document.getElementById("ln_msg");
  try {
    const body = { user_id: currentUser.user_id, account_id: cachedAccounts[0].account_id,
      principal: Number(document.getElementById("ln_principal").value), tenure_months: Number(document.getElementById("ln_tenure").value),
      purpose: document.getElementById("ln_purpose").value };
    const loan = await api("/loans/apply", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">${loan.status === 'active' ? 'Approved & disbursed instantly.' : 'Submitted for review.'}</div>`;
    toast("Loan application submitted.");
    loadLoans(); loadAccountsSilently();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadLoans() {
  const box = document.getElementById("ln_list");
  try {
    const loans = await api(`/loans/user/${currentUser.user_id}`);
    box.innerHTML = loans.length ? loans.map(l => row(
      `$${fmtMoney(l.principal)} · ${l.tenure_months}mo`, badge('', l.status), `EMI $${fmtMoney(l.monthly_emi)}/mo · ${l.purpose || 'No purpose given'}`
    )).join("") : `<div class="empty"><div class="big">No loans yet</div>Apply for your first one.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
