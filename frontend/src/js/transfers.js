/* ---------------- Transfers ----------------
   A real transfer: money actually leaves your account and lands in the
   recipient's, atomically, on the backend (see transfers-service). The
   recipient is looked up by their public account number/ID - you never
   see or need their internal account_id. */
async function renderTransfers() {
  const main = document.getElementById("main");
  const mine = cachedAccounts[0];
  main.innerHTML = pageHeader("Transfers", "Send money") + `
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Send money</h2>
        <p class="hint">${mine ? `From your account · balance $${fmtMoney(mine.balance)}` : "Open an account first."}</p>
        <label>Recipient's account number / ID</label><input id="tr_number" placeholder="e.g. 48219047335" ${mine ? "" : "disabled"} />
        <label>Amount</label><input id="tr_amount" type="number" min="0.01" step="0.01" placeholder="0.00" ${mine ? "" : "disabled"} />
        <label>Note (optional)</label><input id="tr_note" placeholder="What's this for?" ${mine ? "" : "disabled"} />
        <button class="btn" onclick="doTransfer()" ${mine ? "" : "disabled"}>Send</button>
        <div id="tr_msg"></div>
      </div>
      <div class="card fade-in">
        <h2>Transfer history</h2>
        <p class="hint">Every transfer in or out of your account.</p>
        <div id="tr_history">${mine ? '<div class="empty">Loading…</div>' : '<div class="empty">No account yet.</div>'}</div>
      </div>
    </div>
  `;
  if (mine) loadTransferHistory();
}
async function doTransfer() {
  const el = document.getElementById("tr_msg");
  const mine = cachedAccounts[0];
  try {
    if (!mine) throw new Error("Open an account first.");
    const number = document.getElementById("tr_number").value.trim();
    const amount = Number(document.getElementById("tr_amount").value);
    const note = document.getElementById("tr_note").value;
    if (!number) throw new Error("Enter the recipient's account number/ID.");
    const recipient = await api(`/accounts/by-number/${number}`);
    if (recipient.account_id === mine.account_id) throw new Error("You can't transfer to your own account.");
    const body = { from_account_id: mine.account_id, to_account_id: recipient.account_id, amount, user_id: currentUser.user_id, note };
    await api("/transfers", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Sent $${fmtMoney(amount)} to ${recipient.owner_name}.</div>`;
    toast(`Transfer to ${recipient.owner_name} complete.`);
    document.getElementById("tr_number").value = "";
    document.getElementById("tr_amount").value = "";
    document.getElementById("tr_note").value = "";
    loadAccountsSilently();
    loadTransferHistory();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadAccountsSilently() {
  // refresh the cached balance after a transfer, without a full re-render
  try { cachedAccounts = await fetchMyAccounts(); } catch (e) {}
  const mine = cachedAccounts[0];
  const hint = document.querySelector("#main .card .hint");
  if (mine && hint) hint.textContent = `From your account · balance $${fmtMoney(mine.balance)}`;
}
async function loadTransferHistory() {
  const box = document.getElementById("tr_history");
  const mine = cachedAccounts[0];
  if (!mine) return;
  try {
    const rows = await api(`/transfers/account/${mine.account_id}`);
    box.innerHTML = rows.length ? rows.map(t => {
      const out = t.from_account_id === mine.account_id;
      const fromLine = !out && (t.from_user_name || t.from_user_email)
        ? `<div class="when">From ${t.from_user_name || "Unknown"}${t.from_user_email ? " · " + t.from_user_email : ""}</div>` : "";
      return `
        <div class="split" style="justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line);">
          <div>
            <div style="font-size:13px; font-weight:600;">${out ? "Sent" : "Received"}${t.note ? " · " + t.note : ""}</div>
            ${fromLine}
            <div class="when">${fmtWhen(t.created_at)}</div>
          </div>
          <div class="amt ${out ? 'neg' : 'pos'}" style="font-family:var(--mono);">${out ? '−' : '+'}$${fmtMoney(t.amount)}</div>
        </div>
      `;
    }).join("") : `<div class="empty"><div class="big">No transfers yet</div>Send or receive money to see it here.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
