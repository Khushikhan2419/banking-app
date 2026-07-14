/* ---------------- Transactions ---------------- */
async function renderTransactions() {
  const main = document.getElementById("main");
  const opts = cachedAccounts.map(a => `<option value="${a.account_id}">${a.owner_name} — ${a.account_id.slice(0,8)}… ($${fmtMoney(a.balance)})</option>`).join("");
  main.innerHTML = pageHeader("Transactions", "Move money") + `
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>New transaction</h2>
        <p class="hint">Posted instantly; balances update atomically. History is durably stored in S3.</p>
        <label>Account</label>
        <select id="t_account">${opts || '<option value="">No accounts yet — open one first</option>'}</select>
        <label>Type</label>
        <select id="t_type"><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select>
        <label>Amount</label><input id="t_amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
        <button class="btn" onclick="doTransaction()">Submit transaction</button>
        <div id="t_msg"></div>
      </div>
      <div class="card fade-in">
        <h2>Look up history</h2>
        <p class="hint">Pull the full ledger for any account. Click a row to view/download its receipt.</p>
        <label>Account</label>
        <select id="t_lookup">${opts || '<option value="">No accounts yet</option>'}</select>
        <button class="btn ghost" onclick="loadTransactions()">Load history</button>
        <div id="t_history" style="margin-top:10px;"></div>
      </div>
    </div>
  `;
  if (cachedAccounts.length) loadTransactions();
}
async function doTransaction() {
  const el = document.getElementById("t_msg");
  try {
    const body = {
      account_id: document.getElementById("t_account").value,
      type: document.getElementById("t_type").value,
      amount: Number(document.getElementById("t_amount").value),
    };
    if (!body.account_id) throw new Error("Open an account first.");
    await api("/transactions", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Transaction posted.</div>`;
    toast("Transaction posted.");
    loadTransactions();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadTransactions() {
  const id = document.getElementById("t_lookup").value;
  const box = document.getElementById("t_history");
  if (!id) { box.innerHTML = `<div class="empty">Select an account.</div>`; return; }
  box.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const txns = await api(`/transactions/${id}`);
    box.innerHTML = renderLedgerTable(txns, false, true);
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
