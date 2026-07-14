/* ---------------- Payments — "Terminal Ledger" theme ---------------- */
async function renderPayments() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  main.innerHTML = pageHeader("Payments", "Pay a bill") + `
    <div class="pay-term-bar"><span class="pay-dot"></span><span class="pay-dot"></span><span class="pay-dot"></span><span class="pay-path">veerabank@payments:~$</span></div>
  ` + (mine ? `
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Pay a bill</h2>
        <p class="hint">Balance $${fmtMoney(mine.balance)}</p>
        <label>Payee</label><input id="pm_payee" placeholder="Acme Electric" />
        <label>Category</label>
        <select id="pm_category"><option value="utility">Utility</option><option value="phone">Phone</option><option value="credit_card">Credit card</option><option value="other">Other</option></select>
        <label>Amount</label><input id="pm_amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
        <button class="btn" onclick="doPay()">Pay</button>
        <div id="pm_msg"></div>
      </div>
      <div class="card fade-in"><h2>Payment history</h2><div id="pm_list"><div class="empty">Loading…</div></div></div>
    </div>
  ` : noAccountCard("payments"));
  if (mine) loadPayments();
}
async function doPay() {
  const el = document.getElementById("pm_msg");
  try {
    const body = { user_id: currentUser.user_id, account_id: cachedAccounts[0].account_id, payee_name: document.getElementById("pm_payee").value,
      category: document.getElementById("pm_category").value, amount: Number(document.getElementById("pm_amount").value) };
    await api("/payments", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Payment sent.</div>`; toast("Payment sent.");
    loadPayments(); loadAccountsSilently();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadPayments() {
  const box = document.getElementById("pm_list");
  try {
    const payments = await api(`/payments/user/${currentUser.user_id}`);
    box.innerHTML = payments.length ? payments.map(p => row(
      `${p.payee_name} <span class="badge">${p.category}</span>`, `<span class="amt neg" style="font-family:var(--mono);">−$${fmtMoney(p.amount)}</span>`, fmtWhen(p.created_at)
    )).join("") : `<div class="empty"><div class="big">No payments yet</div>Pay your first bill.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
